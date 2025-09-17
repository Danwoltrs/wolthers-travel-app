import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { sendNewTimeProposedNotification, type NewTimeProposedData } from '@/lib/resend';

export async function POST(request: NextRequest) {
  const { meetingId, newDate, newTime } = await request.json();

  if (!meetingId || !newDate || !newTime) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  try {
    const { data: updatedMeeting, error: updateError } = await supabase
      .from('trip_meetings')
      .update({
        meeting_date: newDate,
        start_time: newTime,
        meeting_status: 'pending-approval',
      })
      .eq('id', meetingId)
      .select('id, companies(name), trips(title, access_code, users(full_name, email))')
      .single();

    if (updateError || !updatedMeeting) {
      console.error('[API /propose-time] Error updating meeting:', updateError);
      return NextResponse.json({ error: 'Failed to update meeting.' }, { status: 500 });
    }

    if (updatedMeeting.trips?.users?.email) {
      const emailData: NewTimeProposedData = {
        creatorName: updatedMeeting.trips.users.full_name || 'Trip Creator',
        hostName: updatedMeeting.companies?.name || 'The host',
        tripTitle: updatedMeeting.trips.title || 'Unnamed Trip',
        tripAccessCode: updatedMeeting.trips.access_code,
        newDate: new Date(newDate).toLocaleDateString(),
        newTime: newTime,
      };
      await sendNewTimeProposedNotification(updatedMeeting.trips.users.email, emailData);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API /propose-time] Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
