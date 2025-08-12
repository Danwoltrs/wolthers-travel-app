import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    // Validate code format first
    if (!isValidTripCodeFormat(code)) {
      return NextResponse.json({ 
        isValid: false, 
        message: 'Invalid trip code format. Use format like AMS_BER_QA_1208.' 
      }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Check if the code already exists
    const { data: existingTrip, error } = await supabase
      .from('trips')
      .select('id')
      .eq('access_code', code)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database query error:', error)
      return NextResponse.json({ 
        isValid: false, 
        message: 'Error checking trip code.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      isValid: !existingTrip,
      message: existingTrip 
        ? 'Trip code already in use. Please choose another.' 
        : 'Trip code is available.'
    })

  } catch (error) {
    console.error('Trip code validation error:', error)
    return NextResponse.json({ 
      isValid: false, 
      message: 'Internal server error.' 
    }, { status: 500 })
  }
}

// Validate trip code format
function isValidTripCodeFormat(code: string): boolean {
  // Matches format like AMS_BER_QA_1208
  const tripCodeRegex = /^[A-Z]{3}_[A-Z]{3}_[A-Z]{2}_\d{4}$/
  return tripCodeRegex.test(code)
}

// Optional: Add GET method for direct code status check
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ 
      isValid: false, 
      message: 'Trip code is required.' 
    }, { status: 400 })
  }

  // Reuse the POST logic
  const request_clone = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ code }),
    headers: request.headers
  })

  return POST(request_clone as NextRequest)
}