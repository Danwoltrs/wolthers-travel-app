export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const meetingId = searchParams.get('meetingId')
  const status = searchParams.get('status')

  // 1. Validate the incoming parameters.
  if (!meetingId || !status || !['confirmed', 'declined'].includes(status)) {
    return new Response('<h1>Invalid Request</h1><p>The link you used is missing required parameters. Please contact the trip organizer.</p>', { 
      status: 400, 
      headers: { 'Content-Type': 'text/html' } 
    })
  }

  const supabase = createSupabaseServiceClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://trips.wolthers.com')

  try {
    // 2. Update the status of the corresponding meeting in the database.
    const { data: updatedMeeting, error: updateError } = await supabase
      .from('trip_meetings')
      .update({ meeting_status: status })
      .eq('id', meetingId)
      .select('id, meeting_date, companies(name), trips(title, access_code, users(full_name, email))')
      .single()

    if (updateError || !updatedMeeting) {
      console.error(`[API /visit-response] Error updating meeting status:`, updateError)
      return new Response(`<h1>Error</h1><p>We could not update the meeting status. Please try again or contact the trip organizer.</p>`, { 
        status: 500, 
        headers: { 'Content-Type': 'text/html' } 
      })
    }

    // 3. If the host declined, notify the trip creator.
    if (status === 'declined') {
      console.log(`[API /visit-response] Meeting ${meetingId} declined. Notifying creator.`);
      if (updatedMeeting.trips?.users?.email) {
        const emailData: VisitDeclinedData = {
          creatorName: updatedMeeting.trips.users.full_name || 'Trip Creator',
          hostName: updatedMeeting.companies?.name || 'The host',
          companyName: updatedMeeting.companies?.name || 'the company',
          tripTitle: updatedMeeting.trips.title || 'Unnamed Trip',
          tripAccessCode: updatedMeeting.trips.access_code,
          visitDate: new Date(updatedMeeting.meeting_date).toLocaleDateString(),
        };

        await sendVisitDeclinedNotification(updatedMeeting.trips.users.email, emailData);
      }
      // Redirect the host to a page where they can propose a new time or see a contact message.
      return NextResponse.redirect(`${baseUrl}/propose-new-time?meetingId=${meetingId}`)
    }

    // 4. If the host confirmed, redirect to a generic "thank you" page.
    console.log(`[API /visit-response] Meeting ${meetingId} confirmed.`);
    return NextResponse.redirect(`${baseUrl}/visit-confirmed`)

  } catch (error) {
    console.error(`[API /visit-response] Unexpected error:`, error)
    return new Response('<h1>Internal Server Error</h1><p>An unexpected error occurred.</p>', { 
      status: 500, 
      headers: { 'Content-Type': 'text/html' } 
    })
  }
}

