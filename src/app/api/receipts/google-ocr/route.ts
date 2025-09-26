import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Google Vision API client (no npm package needed, use REST API)
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY
const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }

    // Validate file size (max 20MB for Google Vision)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (imageFile.size > maxSize) {
      return NextResponse.json({ error: 'Image file too large. Maximum size is 20MB.' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: 'Unsupported image format. Please use JPEG, PNG, WebP, or GIF.' }, { status: 400 })
    }

    try {
      // Check if Google Vision is configured
      if (!GOOGLE_VISION_API_KEY) {
        return NextResponse.json({
          error: 'OCR service not configured. Please configure GOOGLE_VISION_API_KEY environment variable.'
        }, { status: 503 })
      }

      // Convert image to base64
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64Image = buffer.toString('base64')

      // Use Google Vision API for OCR with document text detection
      const response = await fetch(`${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image
              },
              features: [
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 1
                }
              ]
            }
          ]
        })
      })

      const visionResult = await response.json()

      if (visionResult.error) {
        throw new Error(`Google Vision API error: ${visionResult.error.message}`)
      }

      const textAnnotations = visionResult.responses?.[0]?.textAnnotations
      const fullTextAnnotation = visionResult.responses?.[0]?.fullTextAnnotation

      if (!textAnnotations || textAnnotations.length === 0) {
        return NextResponse.json({
          success: true,
          fileName: imageFile.name,
          merchant: 'Receipt Scan',
          amount: 0,
          currency: 'BRL',
          date: new Date().toISOString().split('T')[0],
          category: 'other',
          confidence: {
            merchant: 'low',
            amount: 'low',
            date: 'low'
          },
          items: [],
          rawText: 'No text detected in image.'
        })
      }

      // Extract full text from the receipt
      const fullText = textAnnotations[0]?.description || ''

      // Parse receipt data using simple regex patterns (can be enhanced)
      const receiptData = parseReceiptText(fullText)

      return NextResponse.json({
        success: true,
        fileName: imageFile.name,
        ...receiptData,
        rawText: fullText
      })

    } catch (ocrError) {
      console.error('Google Vision OCR error:', ocrError)
      return NextResponse.json({
        error: 'Failed to extract text from receipt. Please try again or enter details manually.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in Google Vision OCR endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Simple receipt text parser (can be enhanced with more sophisticated logic)
function parseReceiptText(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)

  // Initialize default values
  let merchant = 'Unknown Merchant'
  let amount = 0
  let currency = 'BRL'
  let date = new Date().toISOString().split('T')[0]
  let category = 'other'

  // Confidence levels based on pattern matching
  let merchantConfidence: 'high' | 'medium' | 'low' = 'low'
  let amountConfidence: 'high' | 'medium' | 'low' = 'low'
  let dateConfidence: 'high' | 'medium' | 'low' = 'low'

  // Extract merchant (usually first few non-numeric lines)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]
    if (!/^\d|total|sum|subtotal/i.test(line) && line.length > 3) {
      merchant = line
      merchantConfidence = 'medium'
      break
    }
  }

  // Extract amount (look for currency symbols and numbers)
  const amountPatterns = [
    /R?\$\s*([0-9]+[.,][0-9]{2})/i, // R$ 25.50 or $ 25.50
    /([0-9]+[.,][0-9]{2})\s*R?\$/i, // 25.50 R$ or 25.50 $
    /total[:\s]*R?\$?\s*([0-9]+[.,][0-9]{2})/i, // Total: R$ 25.50
    /([0-9]+[.,][0-9]{2})/g // Any decimal number
  ]

  for (const pattern of amountPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      const amountStr = matches[1] || matches[0]
      const parsedAmount = parseFloat(amountStr.replace(',', '.').replace(/[^\d.]/g, ''))
      if (parsedAmount > 0) {
        amount = parsedAmount
        amountConfidence = pattern.source.includes('total') ? 'high' : 'medium'

        // Detect currency
        if (text.includes('R$') || text.includes('BRL')) currency = 'BRL'
        else if (text.includes('$') || text.includes('USD')) currency = 'USD'
        else if (text.includes('€') || text.includes('EUR')) currency = 'EUR'

        break
      }
    }
  }

  // Extract date
  const datePatterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g, // DD/MM/YYYY or DD-MM-YYYY
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g, // YYYY/MM/DD or YYYY-MM-DD
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})/g  // DD/MM/YY or DD-MM-YY
  ]

  for (const pattern of datePatterns) {
    const matches = [...text.matchAll(pattern)]
    if (matches.length > 0) {
      const match = matches[0]
      try {
        let year, month, day

        if (match[3] && match[3].length === 4) {
          // Full year format
          if (parseInt(match[1]) > 12) {
            // First number > 12, likely YYYY/MM/DD
            [, year, month, day] = match
          } else {
            // Likely DD/MM/YYYY
            [, day, month, year] = match
          }
        } else {
          // Short year format DD/MM/YY
          [, day, month] = match
          const shortYear = match[3] ? parseInt(match[3]) : new Date().getFullYear() % 100
          year = shortYear < 50 ? `20${shortYear}` : `19${shortYear}`
        }

        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        if (!isNaN(dateObj.getTime())) {
          date = dateObj.toISOString().split('T')[0]
          dateConfidence = 'high'
          break
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }

  // Categorize based on merchant name or text content
  const categoryKeywords = {
    transportation: ['uber', 'taxi', 'metro', 'bus', 'transport', 'combustivel', 'posto', 'gas'],
    accommodation: ['hotel', 'pousada', 'hospedagem', 'booking'],
    meals: ['restaurant', 'bar', 'cafe', 'coffee', 'lanchonete', 'food', 'pizza', 'burger'],
    supplies: ['papelaria', 'office', 'supplies', 'material'],
    other: []
  }

  const textLower = text.toLowerCase()
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => textLower.includes(keyword))) {
      category = cat
      break
    }
  }

  return {
    merchant,
    amount,
    currency,
    date,
    category,
    confidence: {
      merchant: merchantConfidence,
      amount: amountConfidence,
      date: dateConfidence
    },
    items: [] // Could be enhanced to parse line items
  }
}