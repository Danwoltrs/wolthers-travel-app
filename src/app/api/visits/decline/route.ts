import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tripCode,
      hostEmail,
      token,
      declineReason,
      hasAlternative,
      alternativeDate,
      alternativeTime,
      additionalNotes
    } = body

    // Validate required fields
    if (!tripCode || !hostEmail || !token || !declineReason) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Find the trip by access code
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        access_code,
        start_date,
        end_date,
        created_by,
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

    // Find or create contact record for the host
    let { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, email, phone')
      .eq('email', hostEmail)
      .single()

    if (contactError && contactError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error finding contact:', contactError)
      return NextResponse.json({
        success: false,
        error: 'Database error'
      }, { status: 500 })
    }

    if (!contact) {
      // Create a basic contact record if none exists
      const { data: newContact, error: createContactError } = await supabase
        .from('contacts')
        .insert({
          name: 'Host Contact', // Will be updated when they register
          email: hostEmail,
          phone: null,
          role: 'Host'
        })
        .select('id, name, email, phone')
        .single()

      if (createContactError) {
        console.error('Error creating contact:', createContactError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create contact'
        }, { status: 500 })
      }
      contact = newContact
    }

    // Record the visit decline with potential alternative
    const { error: confirmationError } = await supabase
      .from('visit_confirmations')
      .upsert({
        trip_id: trip.id,
        host_contact_id: contact.id,
        company_id: null, // We'd need to determine this from context
        response_type: 'decline',
        confirmed_at: new Date().toISOString(),
        confirmation_token: token,
        notes: JSON.stringify({
          declineReason,
          hasAlternative,
          alternativeDate: hasAlternative ? alternativeDate : null,
          alternativeTime: hasAlternative ? alternativeTime : null,
          additionalNotes: additionalNotes || null,
          submittedAt: new Date().toISOString()
        })
      }, {
        onConflict: 'trip_id,host_contact_id'
      })

    if (confirmationError) {
      console.error('Error recording visit confirmation:', confirmationError)
      return NextResponse.json({
        success: false,
        error: 'Failed to record response'
      }, { status: 500 })
    }

    // If alternative date/time provided, create a notification for the trip creator
    if (hasAlternative && alternativeDate && alternativeTime) {
      // TODO: Send notification/email to trip creator about alternative date request
      console.log(`📅 Alternative date requested for trip ${tripCode}: ${alternativeDate} at ${alternativeTime}`)
      
      // You could create a notifications table entry here or send an email
      try {
        // Optional: Send email to trip creator about alternative date request
        await fetch('/api/notifications/alternative-date', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: trip.id,
            tripCode,
            tripTitle: trip.title,
            hostEmail,
            hostName: contact.name,
            originalDate: trip.start_date,
            alternativeDate,
            alternativeTime,
            declineReason,
            additionalNotes,
            tripCreatorEmail: trip.users.email
          })
        })
      } catch (emailError) {
        console.error('Failed to send alternative date notification:', emailError)
        // Don't fail the main request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: hasAlternative 
        ? 'Response submitted. The trip organizer will review your alternative date suggestion.'
        : 'Response submitted. Thank you for your prompt response.'
    })

  } catch (error) {
    console.error('Error processing visit decline:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}