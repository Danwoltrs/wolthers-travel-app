import { NextResponse } from 'next/server';
import {
  sendTripCreationEmails,
  sendTripCancellationEmails,
  sendStaffInvitationEmail,
  sendHostInvitationEmail,
  sendHostVisitConfirmationEmail,
  sendVisitDeclinedNotification,
  sendNewTimeProposedNotification,
  type TripCreationEmailData,
  type TripCancellationEmailData,
  type StaffInvitationEmailData,
  type HostInvitationEmailData,
  type HostVisitConfirmationData,
  type VisitDeclinedData,
  type NewTimeProposedData
} from '@/lib/resend';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
  const targetEmail = 'daniel@wolthers.com';
  const userName = 'Daniel Wolthers';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Define all email sending tasks as an array of functions
  const emailTasks = [
    () => {
        const data: TripCreationEmailData = {
            tripTitle: 'Test Trip: Brazil Coffee Origins',
            tripAccessCode: 'BR-CO-2025',
            tripStartDate: '2025-10-20',
            tripEndDate: '2025-10-30',
            createdBy: 'Test System',
            recipients: [{ name: userName, email: targetEmail, role: 'Trip Manager' }]
        };
        return sendTripCreationEmails(data);
    },
    () => {
        const data: TripCancellationEmailData = {
            tripTitle: 'Cancelled Trip: Colombia Exploration',
            tripAccessCode: 'CO-EX-2025',
            tripStartDate: '2025-11-05',
            tripEndDate: '2025-11-15',
            cancelledBy: 'Test System',
            cancellationReason: 'This is an automated test of the cancellation template.',
            stakeholders: [{ name: userName, email: targetEmail, role: 'Stakeholder' }]
        };
        return sendTripCancellationEmails(data);
    },
    () => {
        const data: StaffInvitationEmailData = {
            inviterName: 'Test System',
            inviterEmail: 'test@wolthers.com',
            newStaffName: userName,
            role: 'Coffee Specialist',
            tripTitle: 'Honduras Quality Project'
        };
        return sendStaffInvitationEmail(targetEmail, data);
    },
    () => {
        const data: HostInvitationEmailData = {
            hostName: userName,
            hostEmail: targetEmail,
            companyName: 'Finca El Paraiso',
            tripTitle: 'Guatemala Sourcing Trip',
            tripAccessCode: 'GU-SO-2025',
            tripStartDate: '2025-12-01',
            tripEndDate: '2025-12-10',
            inviterName: 'Test System',
            inviterEmail: 'test@wolthers.com',
            wolthersTeam: [{ name: 'Svenn', role: 'CEO' }],
            confirmationUrl: `${baseUrl}/api/visit-response?meetingId=test-meeting-id`,
            platformLoginUrl: baseUrl,
            visitDate: '2025-12-05',
            visitTime: '10:00 AM'
        };
        return sendHostInvitationEmail(targetEmail, data);
    },
    () => {
        const data: HostVisitConfirmationData = {
            hostName: userName,
            hostEmail: targetEmail,
            companyName: 'Finca Las Nubes',
            tripTitle: 'El Salvador Pacamara Hunt',
            visitDate: '2026-01-15',
            visitTime: '11:00 AM',
            guests: ['Svenn', 'Tom'],
            inviterName: 'Test System',
            inviterEmail: 'test@wolthers.com',
            yesUrl: `${baseUrl}/visit-confirmed?test=true`,
            noUrl: `${baseUrl}/propose-new-time?meetingId=test-meeting-id&test=true`
        };
        return sendHostVisitConfirmationEmail(targetEmail, data);
    },
    () => {
        const data: VisitDeclinedData = {
            creatorName: userName,
            hostName: 'Finca Santa Ana',
            companyName: 'Finca Santa Ana',
            tripTitle: 'Nicaragua Farm Relations',
            visitDate: '2026-02-20',
            tripUrl: `${baseUrl}/trips/test-trip-id`
        };
        return sendVisitDeclinedNotification(targetEmail, data);
    },
    () => {
        const data: NewTimeProposedData = {
            creatorName: userName,
            hostName: 'Finca La Esmeralda',
            tripTitle: 'Panama Geisha Review',
            newDate: '2026-03-10',
            newTime: '14:30',
            tripUrl: `${baseUrl}/trips/test-trip-id`
        };
        return sendNewTimeProposedNotification(targetEmail, data);
    }
  ];

  const results = [];
  for (const [index, task] of emailTasks.entries()) {
    try {
      await task();
      results.push({ templateNumber: index + 1, status: 'fulfilled', error: null });
    } catch (error) {
      results.push({ templateNumber: index + 1, status: 'rejected', error: (error as Error).message });
    }
    // Add a delay to respect rate limits, but not after the last email.
    if (index < emailTasks.length - 1) {
        await delay(500); // 500ms delay
    }
  }

  return NextResponse.json({
    message: 'Test email sequence completed.',
    summary: results
  });
}
