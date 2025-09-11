import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tripCode = searchParams.get('tripCode')
    const hostEmail = searchParams.get('hostEmail')
    const token = searchParams.get('token')

    // Validate required parameters
    if (!tripCode || !hostEmail || !token) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Find the trip by access code with company information
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        access_code,
        start_date,
        end_date,
        created_by,
        companies,
        users!trips_created_by_fkey (
          full_name,
          email
        )
      `)
      .eq('access_code', tripCode)
      .single()

    if (tripError || !trip) {
      console.error('Trip not found:', tripError)
      return NextResponse.json({
        success: false,
        error: 'Trip not found'
      }, { status: 404 })
    }

    // Extract visiting companies (buyer companies) from trip data
    let visitingCompany = 'Our Team'
    try {
      if (trip.companies && Array.isArray(trip.companies)) {
        const buyerCompanies = trip.companies
          .filter((c: any) => c.selectedContacts && c.selectedContacts.length > 0)
          .map((c: any) => c.fantasyName || c.name)
        
        if (buyerCompanies.length > 0) {
          visitingCompany = buyerCompanies.join(', ')
        }
      }
    } catch (err) {
      console.error('Error parsing companies:', err)
      // Use default fallback
    }

    // Return trip details for the decline form
    const tripDetails = {
      id: trip.id,
      title: trip.title,
      accessCode: trip.access_code,
      visitDate: trip.start_date,
      visitTime: 'Morning (9:00 AM - 12:00 PM)', // Default, could be customized per host
      visitingCompany,
      organizer: {
        name: trip.users.full_name,
        email: trip.users.email
      }
    }

    return NextResponse.json({
      success: true,
      ...tripDetails
    })

  } catch (error) {
    console.error('Error fetching trip details:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}