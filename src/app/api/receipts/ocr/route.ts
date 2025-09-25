import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

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

    // Validate file size (max 20MB for OpenAI Vision)
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
      // Check if OpenAI is configured
      if (!openai) {
        return NextResponse.json({
          error: 'OCR service not configured. Please configure OPENAI_API_KEY environment variable.'
        }, { status: 503 })
      }

      // Convert image to base64
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64Image = buffer.toString('base64')
      const mimeType = imageFile.type

      // Use OpenAI Vision API for receipt OCR with structured extraction
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract receipt information from this image and return a JSON object with the following structure:
                {
                  "merchant": "merchant or store name",
                  "amount": numeric total amount,
                  "currency": "currency code (BRL, USD, EUR, etc.)",
                  "date": "date in YYYY-MM-DD format",
                  "category": "one of: transportation, accommodation, meals, supplies, other",
                  "confidence": {
                    "merchant": "high, medium, or low",
                    "amount": "high, medium, or low",
                    "date": "high, medium, or low"
                  },
                  "items": [
                    {
                      "description": "item description",
                      "quantity": 1,
                      "price": numeric price
                    }
                  ]
                }

                Guidelines:
- Use high confidence if text is clear and unambiguous
- Use medium confidence if text is readable but may have minor issues
- Use low confidence if text is unclear or potentially incorrect
- For category, choose the most appropriate from the 5 options
- For currency, detect from symbols or context (R$ = BRL, $ = USD, € = EUR)
- For date, convert any date format to YYYY-MM-DD
- Items array is optional - include if line items are clearly visible
- If no clear receipt data is found, return null values with low confidence

Only return valid JSON, no additional text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      })

      const extractedText = response.choices[0]?.message?.content || '{}'

      try {
        // Parse the JSON response from OpenAI
        const receiptData = JSON.parse(extractedText)

        // Validate the response structure
        const validatedData = {
          merchant: receiptData.merchant || 'Unknown Merchant',
          amount: typeof receiptData.amount === 'number' ? receiptData.amount : 0,
          currency: receiptData.currency || 'BRL',
          date: receiptData.date || new Date().toISOString().split('T')[0],
          category: receiptData.category || 'other',
          confidence: {
            merchant: receiptData.confidence?.merchant || 'low',
            amount: receiptData.confidence?.amount || 'low',
            date: receiptData.confidence?.date || 'low'
          },
          items: Array.isArray(receiptData.items) ? receiptData.items : []
        }

        return NextResponse.json({
          success: true,
          fileName: imageFile.name,
          ...validatedData
        })

      } catch (parseError) {
        console.warn('Failed to parse OpenAI response as JSON:', parseError)

        // Fallback: return basic extracted text with low confidence
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
          rawText: extractedText
        })
      }

    } catch (ocrError) {
      console.error('OpenAI Vision OCR error:', ocrError)
      return NextResponse.json({
        error: 'Failed to extract text from receipt. Please try again or enter details manually.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in receipt OCR endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}