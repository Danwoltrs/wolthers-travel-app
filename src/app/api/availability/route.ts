import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase-server';
import { dateFns } from 'date-fns';

// This endpoint finds available meeting slots for a given declined meeting.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get('meetingId');

  if (!meetingId) {
    return NextResponse.json({ error: 'meetingId is required' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  try {
    // Step 1: Fetch the original meeting, its trip, and the trip creator's contact info.
    const { data: originalMeeting, error: meetingError } = await supabase
      .from('trip_meetings')
      .select(`
        trip_id,
        trips (
          start_date,
          end_date,
          users (full_name, phone)
        )
      `)
      .eq('id', meetingId)
      .single();

    if (meetingError || !originalMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const { trip_id, trips: trip } = originalMeeting;
    const { start_date, end_date, users: creator } = trip;

    // Step 2: Find all Wolthers staff participating in this trip.
    // (Assuming Wolthers company ID is '840783f4-866d-4bdb-9b5d-5d0facf62db0')
    const { data: staffParticipants, error: staffError } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', trip_id)
      .eq('company_id', '840783f4-866d-4bdb-9b5d-5d0facf62db0');

    if (staffError) {
      return NextResponse.json({ error: 'Could not fetch staff participants' }, { status: 500 });
    }

    const staffUserIds = staffParticipants.map(p => p.user_id);

    // Step 3: Get all existing meetings for these staff members during the trip.
    const { data: busySlots, error: busySlotsError } = await supabase
      .from('meeting_attendees')
      .select(`
        meeting_id,
        trip_meetings ( meeting_date, start_time, end_time )
      `)
      .in('user_id', staffUserIds)
      .eq('trip_meetings.trip_id', trip_id);

    if (busySlotsError) {
      return NextResponse.json({ error: 'Could not fetch busy slots' }, { status: 500 });
    }

    // Step 4: Calculate availability.
    const availableSlots = [];
    const potentialTimes = ['09:00:00', '11:00:00', '14:00:00', '16:00:00']; // Predefined slots
    const meetingDurationHours = 2; // Assume a 2-hour duration for meetings

    let currentDate = new Date(start_date);
    const finalDate = new Date(end_date);

    while (currentDate <= finalDate && availableSlots.length < 6) {
      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      for (const time of potentialTimes) {
        const slotStart = new Date(`${currentDate.toISOString().split('T')[0]}T${time}`);
        const slotEnd = new Date(slotStart.getTime() + meetingDurationHours * 60 * 60 * 1000);

        let isSlotFree = true;
        for (const busy of busySlots) {
          const meeting = busy.trip_meetings;
          if (!meeting) continue;

          const busyStart = new Date(`${meeting.meeting_date}T${meeting.start_time}`);
          const busyEnd = meeting.end_time 
            ? new Date(`${meeting.meeting_date}T${meeting.end_time}`) 
            : new Date(busyStart.getTime() + meetingDurationHours * 60 * 60 * 1000);

          // Check for overlap
          if (slotStart < busyEnd && slotEnd > busyStart) {
            isSlotFree = false;
            break;
          }
        }

        if (isSlotFree) {
          availableSlots.push({ 
            date: slotStart.toISOString().split('T')[0],
            time: time.substring(0, 5) // Format as HH:mm
          });
        }

        if (availableSlots.length >= 6) break;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Step 5: Return the results.
    return NextResponse.json({
      availableSlots,
      creatorContact: {
        name: creator?.full_name || 'Wolthers Team',
        phone: creator?.phone || 'Not available'
      }
    });

  } catch (error) {
    console.error('[API /availability] Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
