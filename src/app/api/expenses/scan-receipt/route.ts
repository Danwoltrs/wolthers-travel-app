import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createWorker } from 'tesseract.js'

// Enhanced categories for multi-language expense classification
const expenseCategories = {
  'transport': [
    // English
    'taxi', 'uber', 'lyft', 'bus', 'train', 'flight', 'airline', 'airport', 'parking', 'metro', 'subway', 'transport',
    // Portuguese
    'táxi', 'ônibus', 'trem', 'voo', 'aeroporto', 'estacionamento', 'metrô', 'transporte', 'viagem',
    // Spanish
    'autobús', 'avión', 'vuelo', 'aeropuerto', 'aparcamiento', 'transporte', 'viaje'
  ],
  'accommodation': [
    // English
    'hotel', 'inn', 'resort', 'lodge', 'hostel', 'bed', 'breakfast', 'motel', 'accommodation',
    // Portuguese
    'hotel', 'pousada', 'resort', 'hospedagem', 'acomodação', 'quarto',
    // Spanish
    'hotel', 'posada', 'alojamiento', 'habitación'
  ],
  'meals': [
    // English
    'restaurant', 'cafe', 'coffee', 'bar', 'pub', 'food', 'pizza', 'burger', 'sandwich', 'breakfast', 'lunch', 'dinner', 'starbucks', 'mcdonalds', 'meal',
    // Portuguese
    'restaurante', 'café', 'lanchonete', 'padaria', 'comida', 'almoço', 'jantar', 'refeição', 'bebida', 'chopp', 'cerveja',
    // Spanish
    'restaurante', 'cafetería', 'comida', 'almuerzo', 'cena', 'bebida', 'cerveza'
  ],
  'activities': [
    // English
    'museum', 'tour', 'ticket', 'entertainment', 'cinema', 'theater', 'park', 'attraction', 'activity',
    // Portuguese
    'museu', 'passeio', 'ingresso', 'entretenimento', 'cinema', 'teatro', 'parque', 'atração', 'atividade',
    // Spanish
    'museo', 'entrada', 'entretenimiento', 'cine', 'teatro', 'parque', 'atracción', 'actividad'
  ],
  'business': [
    // English
    'office', 'supplies', 'meeting', 'conference', 'coworking', 'internet', 'phone', 'business',
    // Portuguese
    'escritório', 'suprimentos', 'reunião', 'conferência', 'internet', 'telefone', 'negócios',
    // Spanish
    'oficina', 'suministros', 'reunión', 'conferencia', 'internet', 'teléfono', 'negocios'
  ],
  'other': []
}

// Common card networks and their patterns
const cardPatterns = {
  'visa': /4\d{3}/,
  'mastercard': /5[1-5]\d{2}/,
  'amex': /3[47]\d{2}/,
  'discover': /6(?:011|5\d{2})/,
  'diners': /3[0689]\d{2}/
}

// Enhanced OCR processing with timeout and fallback mechanisms
async function processReceiptWithOCR(imageBuffer: Buffer): Promise<{
  amount: number | null
  currency: string
  date: string
  venue: string
  cardLast4: string | null
  extractedText: string
}> {
  const OCR_TIMEOUT = 30000 // 30 seconds timeout
  
  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('OCR processing timeout after 30 seconds'))
    }, OCR_TIMEOUT)
  })

  try {
    console.log('Starting OCR processing with timeout...')
    
    // Race between OCR processing and timeout
    const ocrPromise = performOCRWithTimeout(imageBuffer)
    const result = await Promise.race([ocrPromise, timeoutPromise])
    
    console.log('OCR processing result:', result)
    return result

  } catch (error) {
    console.error('OCR processing failed:', error)
    
    // Enhanced fallback - try lightweight OCR first
    console.log('Attempting fallback OCR processing...')
    try {
      return await fallbackOCRProcessing(imageBuffer)
    } catch (fallbackError) {
      console.error('Fallback OCR also failed:', fallbackError)
      
      // Final fallback with intelligent defaults
      return generateIntelligentFallback(imageBuffer)
    }
  }
}

// Main OCR processing with optimizations
async function performOCRWithTimeout(imageBuffer: Buffer) {
  let worker = null
  
  try {
    // Use only English for faster processing - users can manually correct if needed
    console.log('Creating OCR worker (English only for speed)...')
    worker = await createWorker(['eng'], 1, {
      logger: m => {
        // Reduce logging noise
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      }
    })

    console.log('OCR worker ready, processing image...')
    
    // Convert buffer to base64 for Tesseract.js
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
    
    // Perform OCR recognition with optimized settings
    const { data: { text } } = await worker.recognize(base64Image, {
      tessedit_ocr_engine_mode: '1', // Use LSTM OCR engine only (faster)
      tessedit_pageseg_mode: '6',    // Uniform block of text
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/:$€£¥R-'
    })
    
    console.log('OCR completed. Extracted text:', text.substring(0, 500) + '...')
    
    // Extract information from the recognized text
    return {
      amount: extractAmount(text),
      currency: extractCurrency(text),
      date: extractDate(text),
      venue: extractVenue(text),
      cardLast4: extractCardLast4(text),
      extractedText: text
    }

  } finally {
    // Ensure worker is always terminated
    if (worker) {
      try {
        await worker.terminate()
        console.log('OCR worker terminated')
      } catch (terminateError) {
        console.error('Error terminating OCR worker:', terminateError)
      }
    }
  }
}

// Lightweight fallback OCR (English only, minimal processing)
async function fallbackOCRProcessing(imageBuffer: Buffer) {
  let worker = null
  
  try {
    console.log('Fallback: Creating lightweight OCR worker...')
    worker = await createWorker(['eng'], 1, {
      logger: () => {} // Silent logging for fallback
    })
    
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
    
    // Use fastest possible settings
    const { data: { text } } = await worker.recognize(base64Image, {
      tessedit_ocr_engine_mode: '0', // Legacy engine (sometimes faster)
      tessedit_pageseg_mode: '8',    // Single word
    })
    
    return {
      amount: extractAmount(text) || 0,
      currency: 'BRL',
      date: new Date().toISOString().split('T')[0],
      venue: extractVenue(text) || 'Receipt',
      cardLast4: extractCardLast4(text),
      extractedText: text || 'Partial text extracted'
    }

  } finally {
    if (worker) {
      try {
        await worker.terminate()
      } catch (e) {
        console.error('Error terminating fallback worker:', e)
      }
    }
  }
}

// Generate intelligent fallback when OCR completely fails
function generateIntelligentFallback(imageBuffer: Buffer) {
  const now = new Date()
  
  return {
    amount: null,
    currency: 'BRL',
    date: now.toISOString().split('T')[0],
    venue: 'Manual Entry Required',
    cardLast4: null,
    extractedText: `OCR processing failed after multiple attempts. Image size: ${Math.round(imageBuffer.length / 1024)}KB. Please enter receipt details manually.`
  }
}

function extractAmount(text: string): number | null {
  // Enhanced patterns for multiple languages and formats
  const patterns = [
    // Portuguese: "Total:", "Total ", "TOTAL:"
    /total[:\s]*[R$€£¥]*\s*(\d+[.,]\d{2})/i,
    // Spanish: "Total:", "TOTAL:", "Importe:"
    /(?:total|importe)[:\s]*[R$€£¥]*\s*(\d+[.,]\d{2})/i,
    // English: "Total:", "Amount:", "TOTAL"
    /(?:total|amount)[:\s]*[R$€£¥$]*\s*(\d+[.,]\d{2})/i,
    // Currency followed by amount
    /[R$€£¥]\s*(\d+[.,]\d{2})/g,
    // Amount followed by currency
    /(\d+[.,]\d{2})\s*[R$€£¥]/g,
    // Just numbers with decimal
    /(\d+[.,]\d{2})/g
  ]

  const amounts: number[] = []
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const amountStr = match[1] || match[0]
      // Handle both comma and dot as decimal separator
      const normalizedAmount = amountStr.replace(',', '.').replace(/[^\d.]/g, '')
      const amount = parseFloat(normalizedAmount)
      if (amount > 0 && amount < 100000) { // Reasonable range for receipts
        amounts.push(amount)
      }
    }
  }

  // Return the largest amount found (likely the total)
  return amounts.length > 0 ? Math.max(...amounts) : null
}

function extractCurrency(text: string): string {
  // Enhanced currency detection for multiple languages
  const lowerText = text.toLowerCase()
  
  // Brazilian Real - common in Portuguese text
  if (text.includes('R$') || lowerText.includes('brl') || lowerText.includes('real')) return 'BRL'
  
  // US Dollar
  if (text.includes('$') || lowerText.includes('usd') || lowerText.includes('dollar')) return 'USD'
  
  // Euro - common in Spanish text
  if (text.includes('€') || lowerText.includes('eur') || lowerText.includes('euro')) return 'EUR'
  
  // British Pound
  if (text.includes('£') || lowerText.includes('gbp') || lowerText.includes('pound')) return 'GBP'
  
  // Spanish Peso (common in Spanish-speaking countries)
  if (lowerText.includes('peso') || text.includes('$') && lowerText.includes('peso')) return 'MXN'
  
  // Default to BRL for Brazil-based business
  return 'BRL'
}

function extractDate(text: string): string {
  // Enhanced date patterns for multiple languages
  const datePatterns = [
    // English: "Date:", "DATE:"
    /date[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    // Portuguese: "Data:", "DATA:"
    /data[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    // Spanish: "Fecha:", "FECHA:"
    /fecha[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    // General date pattern
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
    // ISO format
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g
  ]

  for (const pattern of datePatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const dateStr = match[1]
      try {
        // Handle different date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
        let parsedDate: Date
        
        if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
          // ISO format YYYY-MM-DD
          parsedDate = new Date(dateStr)
        } else {
          // Assume DD/MM/YYYY format (common in Brazil/Spanish countries)
          const parts = dateStr.split(/[\/\-\.]/)
          if (parts.length === 3) {
            let day = parseInt(parts[0])
            let month = parseInt(parts[1])
            let year = parseInt(parts[2])
            
            // Handle 2-digit years
            if (year < 100) {
              year += year < 50 ? 2000 : 1900
            }
            
            // Create date (month is 0-indexed in JavaScript)
            parsedDate = new Date(year, month - 1, day)
          } else {
            continue
          }
        }
        
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0]
        }
      } catch {
        // Continue to next pattern
      }
    }
  }

  // Default to today
  return new Date().toISOString().split('T')[0]
}

function extractVenue(text: string): string {
  // Enhanced venue extraction for multiple languages
  const lines = text.split(/[\n\r]/).map(line => line.trim()).filter(line => line.length > 0)
  
  // Multi-language business indicators
  const businessIndicators = [
    // English
    'RESTAURANT', 'CAFE', 'COFFEE', 'HOTEL', 'STORE', 'SHOP', 'COMPANY', 'INC', 'LLC', 'BAR', 'PUB',
    // Portuguese
    'RESTAURANTE', 'LANCHONETE', 'PADARIA', 'MERCADO', 'LOJA', 'EMPRESA', 'LTDA', 'EIRELI',
    // Spanish
    'RESTAURANTE', 'CAFETERIA', 'TIENDA', 'MERCADO', 'EMPRESA', 'S.A.', 'S.L.', 'TABERNA'
  ]
  
  // Check first few lines for business name
  for (const line of lines.slice(0, 5)) {
    if (line.length > 2 && line.length < 80) {
      // Skip lines that are clearly not business names
      const upperLine = line.toUpperCase()
      if (upperLine.includes('CNPJ') || upperLine.includes('NIT') || 
          upperLine.includes('ADDRESS') || upperLine.includes('ENDERECO') ||
          upperLine.includes('DIRECCION') || upperLine.includes('TEL') ||
          upperLine.includes('PHONE') || /^\d+$/.test(line)) {
        continue
      }
      
      // Clean common prefixes/suffixes
      let cleaned = line
        .replace(/^(THE|A|EL|LA|O|A)\s+/i, '') // Articles in EN/ES/PT
        .replace(/\s+(INC|LLC|LTD|CO|LTDA|EIRELI|S\.A\.|S\.L\.)\.?$/i, '') // Company suffixes
        .replace(/\s*(RESTAURANT|RESTAURANTE|CAFE|CAFETERIA|COFFEE)$/i, '') // Common suffixes
      
      if (cleaned.length > 2 && cleaned.length < 50) {
        return cleaned.trim()
      }
    }
  }

  return 'Unknown Venue'
}

function extractCardLast4(text: string): string | null {
  // Enhanced card patterns for multiple languages
  const cardPatterns = [
    // Standard patterns
    /•{4}\s*(\d{4})/,
    /\*{4}\s*(\d{4})/,
    /xxxx\s*(\d{4})/i,
    // English
    /ending\s*in\s*(\d{4})/i,
    /card\s*.*?(\d{4})/i,
    // Portuguese
    /cartão\s*.*?(\d{4})/i,
    /final\s*(\d{4})/i,
    /terminado\s*em\s*(\d{4})/i,
    // Spanish
    /tarjeta\s*.*?(\d{4})/i,
    /terminada\s*en\s*(\d{4})/i,
    // Full card number (extract last 4)
    /\d{4}\s*\d{4}\s*\d{4}\s*(\d{4})/,
    // Masked patterns
    /\*+\s*(\d{4})/,
    /x+\s*(\d{4})/i
  ]

  for (const pattern of cardPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const last4 = match[1]
      // Validate it's actually 4 digits
      if (/^\d{4}$/.test(last4)) {
        return last4
      }
    }
  }

  return null
}

function categorizeExpense(venue: string, text: string): string {
  const lowerText = `${venue} ${text}`.toLowerCase()
  
  for (const [category, keywords] of Object.entries(expenseCategories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category
    }
  }
  
  return 'other'
}

export async function POST(request: NextRequest) {
  try {
    // Authentication logic (same as other APIs)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    // Try Authorization header first, then cookie
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify token and get user
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    let user: any = null
    
    try {
      const decoded = verify(token, secret) as any
      const supabase = createServerSupabaseClient()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()
      
      if (userError || !userData) {
        console.error('Failed to fetch user:', userError)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      user = userData
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image or PDF.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Process with OCR
    const ocrResult = await processReceiptWithOCR(buffer)

    // Categorize the expense
    const category = categorizeExpense(ocrResult.venue, ocrResult.extractedText)

    // Determine if it's likely a personal card (basic heuristic)
    const isPersonalCard = !ocrResult.venue.toLowerCase().includes('company') && 
                          Math.random() > 0.3 // Mock logic

    const response = {
      success: true,
      data: {
        amount: ocrResult.amount,
        currency: ocrResult.currency,
        date: ocrResult.date,
        venue: ocrResult.venue,
        category,
        cardLast4: ocrResult.cardLast4,
        isPersonalCard,
        requiresReimbursement: isPersonalCard,
        extractedText: ocrResult.extractedText,
        confidence: Math.random() * 0.3 + 0.7 // Mock confidence score
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('OCR processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}