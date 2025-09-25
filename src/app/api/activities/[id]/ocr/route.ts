import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id
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

      // Use OpenAI Vision API for OCR
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text content from this image. This might be a slideshow presentation, document, or meeting notes. Please provide the extracted text in a clean, readable format, preserving the structure and hierarchy when possible. If there are headings, bullet points, or other formatting, please indicate them appropriately. If no text is found, respond with 'No text detected in image.'"
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
        max_tokens: 1000,
        temperature: 0.1
      })

      const extractedText = response.choices[0]?.message?.content || 'No text detected in image.'

      // Optionally store the OCR result in the database
      const { data: ocrRecord, error: dbError } = await supabase
        .from('activity_notes')
        .insert({
          itinerary_item_id: activityId,
          user_id: user.id,
          content: {
            type: 'ocr_extraction',
            text: extractedText,
            image_name: imageFile.name,
            image_size: imageFile.size,
            extracted_at: new Date().toISOString()
          },
          is_private: false,
          created_by_name: user.user_metadata?.full_name || user.email
        })
        .select()
        .single()

      if (dbError) {
        console.warn('Could not save OCR result to database:', dbError)
        // Continue anyway, just return the extracted text
      }

      return NextResponse.json({
        text: extractedText,
        success: true,
        id: ocrRecord?.id,
        fileName: imageFile.name
      })

    } catch (ocrError) {
      console.error('OpenAI Vision OCR error:', ocrError)
      return NextResponse.json({ 
        error: 'Failed to extract text from image. Please try again.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in OCR endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}