/**
 * Resend API Integration Test Suite
 * 
 * Tests the integration with Resend email service including:
 * - Email template compilation and sending
 * - Rate limiting and error handling
 * - Email content validation
 * - Delivery tracking and status reporting
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { Resend } from 'resend'
import {
  sendHostInvitationEmail,
  sendGuestItineraryEmail,
  sendStaffInvitationEmail,
  sendHostMeetingRequestEmail,
  type HostInvitationEmailData,
  type GuestItineraryData,
  type StaffInvitationEmailData,
  type HostMeetingRequestData
} from '@/lib/resend'

// Mock Resend SDK
jest.mock('resend')

describe('Resend API Integration', () => {
  let mockResend: jest.Mocked<Resend>
  let mockSendMethod: jest.Mock
  const originalEnv = process.env

  beforeAll(() => {
    // Set up test environment
    process.env.RESEND_API_KEY = 'test-resend-api-key'
  })

  afterAll(() => {
    // Restore environment
    process.env = originalEnv
  })

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock the Resend SDK
    mockSendMethod = jest.fn()
    mockResend = {
      emails: {
        send: mockSendMethod
      }
    } as any

    ;(Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => mockResend)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Host Invitation Email Tests', () => {
    
    it('should send host invitation email with correct data', async () => {
      const mockEmailData: HostInvitationEmailData = {
        hostName: 'John Host Manager',
        hostEmail: 'john@clientcompany.com',
        companyName: 'Client Company Ltd',
        tripTitle: 'Q1 Strategy Meeting',
        tripAccessCode: 'STR_Q1_0124',
        tripStartDate: '2024-01-20',
        tripEndDate: '2024-01-22',
        inviterName: 'Maria Organizer',
        inviterEmail: 'maria@wolthers.com',
        wolthersTeam: [
          { name: 'Senior Consultant', role: 'Lead Advisor' },
          { name: 'Project Manager', role: 'Operations' }
        ],
        confirmationUrl: 'https://app.wolthers.com/host/confirm/trip-123',
        platformLoginUrl: 'https://app.wolthers.com/host/login',
        visitingCompanyName: 'Wolthers & Associates',
        visitDate: 'Saturday, January 20, 2024',
        visitTime: '9:00 AM'
      }

      // Mock successful email send
      mockSendMethod.mockResolvedValue({
        id: 'email-host-invitation-123',
        from: 'trips@trips.wolthers.com',
        to: ['john@clientcompany.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      const result = await sendHostInvitationEmail(mockEmailData.hostEmail, mockEmailData)

      expect(result.success).toBe(true)
      expect(result.id).toBe('email-host-invitation-123')
      expect(result.error).toBeUndefined()

      // Verify Resend was called with correct parameters
      expect(mockSendMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'trips@trips.wolthers.com',
          to: ['john@clientcompany.com'],
          subject: expect.stringContaining('Meeting Invitation'),
          html: expect.stringContaining('John Host Manager'),
          html: expect.stringContaining('Q1 Strategy Meeting'),
          html: expect.stringContaining('STR_Q1_0124')
        })
      )
    })

    it('should handle Resend API rate limiting', async () => {
      const mockEmailData: HostInvitationEmailData = {
        hostName: 'Test Host',
        hostEmail: 'test@client.com',
        companyName: 'Test Company',
        tripTitle: 'Test Trip',
        tripAccessCode: 'TEST_001',
        tripStartDate: '2024-01-20',
        tripEndDate: '2024-01-20',
        inviterName: 'Test Organizer',
        inviterEmail: 'organizer@wolthers.com',
        wolthersTeam: [],
        confirmationUrl: 'https://app.wolthers.com/host/confirm/trip-123',
        platformLoginUrl: 'https://app.wolthers.com/host/login',
        visitingCompanyName: 'Wolthers & Associates',
        visitDate: 'Today',
        visitTime: '9:00 AM'
      }

      // Mock rate limit error
      const rateLimitError = new Error('Rate limit exceeded')
      ;(rateLimitError as any).status = 429
      mockSendMethod.mockRejectedValue(rateLimitError)

      const result = await sendHostInvitationEmail(mockEmailData.hostEmail, mockEmailData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Rate limit exceeded')
      expect(result.retryAfter).toBeDefined()
    })

    it('should validate required fields in host invitation', async () => {
      const incompleteData = {
        hostEmail: 'test@client.com'
        // Missing required fields
      } as HostInvitationEmailData

      const result = await sendHostInvitationEmail('test@client.com', incompleteData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Missing required field')
    })

    it('should generate proper HTML template for host invitation', async () => {
      const mockEmailData: HostInvitationEmailData = {
        hostName: 'Alice Host',
        hostEmail: 'alice@company.com',
        companyName: 'Tech Innovations Inc',
        tripTitle: 'Digital Transformation Workshop',
        tripAccessCode: 'DIG_TRANS_0324',
        tripStartDate: '2024-03-15',
        tripEndDate: '2024-03-17',
        inviterName: 'Bob Wolthers',
        inviterEmail: 'bob@wolthers.com',
        wolthersTeam: [
          { name: 'Dr. Sarah Tech', role: 'Digital Strategy Lead' },
          { name: 'Mike Developer', role: 'Technical Implementation' }
        ],
        confirmationUrl: 'https://app.wolthers.com/host/confirm/trip-456',
        platformLoginUrl: 'https://app.wolthers.com/host/login',
        visitingCompanyName: 'Wolthers & Associates',
        visitDate: 'Friday, March 15, 2024',
        visitTime: '10:00 AM'
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-template-test-123',
        from: 'trips@trips.wolthers.com',
        to: ['alice@company.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      await sendHostInvitationEmail(mockEmailData.hostEmail, mockEmailData)

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      // Verify HTML template contains all key information
      expect(emailCall.html).toContain('Alice Host')
      expect(emailCall.html).toContain('Tech Innovations Inc')
      expect(emailCall.html).toContain('Digital Transformation Workshop')
      expect(emailCall.html).toContain('DIG_TRANS_0324')
      expect(emailCall.html).toContain('Dr. Sarah Tech')
      expect(emailCall.html).toContain('Mike Developer')
      expect(emailCall.html).toContain('https://app.wolthers.com/host/confirm/trip-456')
      
      // Verify plain text version is also generated
      expect(emailCall.text).toBeTruthy()
      expect(emailCall.text).toContain('Alice Host')
      expect(emailCall.text).toContain('Digital Transformation Workshop')
    })
  })

  describe('Guest Itinerary Email Tests', () => {
    
    it('should send comprehensive guest itinerary email', async () => {
      const mockItineraryData: GuestItineraryData = {
        guestName: 'Jennifer Guest',
        guestEmail: 'jennifer@guestcompany.com',
        tripTitle: 'Strategic Partnership Meeting',
        tripAccessCode: 'PART_MTG_0224',
        tripStartDate: '2024-02-10',
        tripEndDate: '2024-02-12',
        createdBy: 'Carlos Organizer',
        itinerary: [
          {
            date: '2024-02-10',
            activities: [
              {
                time: '9:00 AM',
                title: 'Welcome & Introductions',
                location: 'Conference Room A',
                duration: '30 minutes',
                type: 'meeting',
                description: 'Team introductions and agenda overview'
              },
              {
                time: '10:00 AM',
                title: 'Strategy Presentation',
                location: 'Main Auditorium',
                duration: '90 minutes',
                type: 'meeting',
                description: 'Q1 strategic initiatives overview'
              }
            ]
          }
        ],
        accommodation: {
          name: 'Business Central Hotel',
          address: '123 Business Avenue, São Paulo, SP',
          phone: '+55 11 1234-5678',
          checkIn: '2024-02-09 15:00',
          checkOut: '2024-02-12 11:00'
        },
        transportation: {
          type: 'airport_transfer',
          details: 'Private transfer from GRU Airport',
          arrivalTime: '2024-02-09 18:30',
          departureTime: '2024-02-12 14:00'
        },
        emergencyContacts: [
          {
            name: 'Carlos Organizer',
            role: 'Trip Coordinator',
            email: 'carlos@wolthers.com',
            phone: '+55 11 9999-1111'
          },
          {
            name: 'Emergency Support',
            role: 'After Hours Support',
            email: 'emergency@wolthers.com',
            phone: '+55 11 9999-9999'
          }
        ],
        specialInstructions: 'Please bring photo ID for building access'
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-guest-itinerary-456',
        from: 'trips@trips.wolthers.com',
        to: ['jennifer@guestcompany.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      const result = await sendGuestItineraryEmail(mockItineraryData.guestEmail, mockItineraryData)

      expect(result.success).toBe(true)
      expect(result.id).toBe('email-guest-itinerary-456')

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      // Verify comprehensive itinerary content
      expect(emailCall.html).toContain('Jennifer Guest')
      expect(emailCall.html).toContain('Strategic Partnership Meeting')
      expect(emailCall.html).toContain('Welcome & Introductions')
      expect(emailCall.html).toContain('Conference Room A')
      expect(emailCall.html).toContain('Business Central Hotel')
      expect(emailCall.html).toContain('Private transfer from GRU Airport')
      expect(emailCall.html).toContain('Carlos Organizer')
      expect(emailCall.html).toContain('photo ID for building access')
    })

    it('should handle itinerary with multiple days and activities', async () => {
      const multiDayItinerary: GuestItineraryData = {
        guestName: 'Multi Day Guest',
        guestEmail: 'guest@multi.com',
        tripTitle: 'Extended Workshop',
        tripAccessCode: 'EXT_WORK_0224',
        tripStartDate: '2024-02-10',
        tripEndDate: '2024-02-14',
        createdBy: 'Workshop Organizer',
        itinerary: [
          {
            date: '2024-02-10',
            activities: [
              { time: '9:00 AM', title: 'Day 1 Kickoff', location: 'Room 1', type: 'meeting' },
              { time: '12:00 PM', title: 'Lunch Break', location: 'Restaurant', type: 'meal' },
              { time: '2:00 PM', title: 'Afternoon Session', location: 'Room 1', type: 'meeting' }
            ]
          },
          {
            date: '2024-02-11',
            activities: [
              { time: '9:00 AM', title: 'Day 2 Workshop', location: 'Room 2', type: 'activity' },
              { time: '3:00 PM', title: 'Site Visit', location: 'Factory', type: 'transport' }
            ]
          },
          {
            date: '2024-02-12',
            activities: [
              { time: '10:00 AM', title: 'Final Presentations', location: 'Auditorium', type: 'meeting' }
            ]
          }
        ],
        emergencyContacts: [
          { name: 'Support', role: 'Help', email: 'help@wolthers.com' }
        ]
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-multiday-789',
        from: 'trips@trips.wolthers.com',
        to: ['guest@multi.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      const result = await sendGuestItineraryEmail(multiDayItinerary.guestEmail, multiDayItinerary)

      expect(result.success).toBe(true)

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      // Verify all days are included
      expect(emailCall.html).toContain('Day 1 Kickoff')
      expect(emailCall.html).toContain('Day 2 Workshop')
      expect(emailCall.html).toContain('Final Presentations')
      
      // Verify different activity types are handled
      expect(emailCall.html).toContain('meeting')
      expect(emailCall.html).toContain('meal')
      expect(emailCall.html).toContain('activity')
      expect(emailCall.html).toContain('transport')
    })

    it('should generate calendar attachment for itinerary', async () => {
      const itineraryWithCalendar: GuestItineraryData = {
        guestName: 'Calendar Guest',
        guestEmail: 'calendar@guest.com',
        tripTitle: 'Calendar Test Trip',
        tripAccessCode: 'CAL_TEST_001',
        tripStartDate: '2024-03-01',
        tripEndDate: '2024-03-01',
        createdBy: 'Calendar Organizer',
        itinerary: [
          {
            date: '2024-03-01',
            activities: [
              {
                time: '10:00 AM',
                title: 'Important Meeting',
                location: 'Office Building',
                duration: '60 minutes',
                type: 'meeting',
                description: 'Monthly sync meeting'
              }
            ]
          }
        ],
        emergencyContacts: [
          { name: 'Support', role: 'Help', email: 'support@wolthers.com' }
        ]
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-calendar-attachment-123',
        from: 'trips@trips.wolthers.com',
        to: ['calendar@guest.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      const result = await sendGuestItineraryEmail(itineraryWithCalendar.guestEmail, itineraryWithCalendar)

      expect(result.success).toBe(true)

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      // Should include calendar download link or attachment
      expect(emailCall.html).toMatch(/(calendar|ics|download|add to calendar)/i)
    })
  })

  describe('Staff Invitation Email Tests', () => {
    
    it('should send staff invitation with team information', async () => {
      const staffData: StaffInvitationEmailData = {
        inviterName: 'Manager Smith',
        inviterEmail: 'manager@wolthers.com',
        newStaffName: 'New Team Member',
        role: 'Senior Consultant',
        tripTitle: 'Client Strategy Session',
        whatsApp: '+55 11 99999-8888'
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-staff-invitation-789',
        from: 'trips@trips.wolthers.com',
        to: ['newstaff@wolthers.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      const result = await sendStaffInvitationEmail('newstaff@wolthers.com', staffData)

      expect(result.success).toBe(true)
      expect(result.id).toBe('email-staff-invitation-789')

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      expect(emailCall.html).toContain('New Team Member')
      expect(emailCall.html).toContain('Senior Consultant')
      expect(emailCall.html).toContain('Client Strategy Session')
      expect(emailCall.html).toContain('Manager Smith')
      expect(emailCall.html).toContain('+55 11 99999-8888')
    })

    it('should handle staff invitation without optional fields', async () => {
      const minimalStaffData: StaffInvitationEmailData = {
        inviterName: 'Basic Manager',
        inviterEmail: 'basic@wolthers.com',
        newStaffName: 'Basic Staff',
        role: 'Team Member'
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-minimal-staff-123',
        from: 'trips@trips.wolthers.com',
        to: ['basic@wolthers.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      const result = await sendStaffInvitationEmail('basic@wolthers.com', minimalStaffData)

      expect(result.success).toBe(true)

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      expect(emailCall.html).toContain('Basic Staff')
      expect(emailCall.html).toContain('Team Member')
      expect(emailCall.html).not.toContain('undefined')
      expect(emailCall.html).not.toContain('null')
    })
  })

  describe('Host Meeting Request Email Tests', () => {
    
    it('should send meeting request with response URLs', async () => {
      const meetingRequestData: HostMeetingRequestData = {
        hostName: 'Meeting Host',
        hostEmail: 'host@meeting.com',
        companyName: 'Meeting Corp',
        meetingTitle: 'Quarterly Review',
        meetingDate: '2024-03-15T14:00:00Z',
        meetingTime: '2:00 PM',
        meetingDuration: '90 minutes',
        meetingLocation: 'Conference Room B',
        meetingDescription: 'Q1 performance and Q2 planning',
        wolthersTeam: [
          { name: 'Lead Analyst', role: 'Data Specialist' },
          { name: 'Project Coordinator', role: 'Operations' }
        ],
        tripTitle: 'Q1 Review Trip',
        tripAccessCode: 'Q1_REV_0324',
        inviterName: 'Trip Manager',
        inviterEmail: 'manager@wolthers.com',
        acceptUrl: 'https://app.wolthers.com/meeting/response/accept?token=accept-token-123',
        declineUrl: 'https://app.wolthers.com/meeting/response/decline?token=decline-token-456',
        rescheduleUrl: 'https://app.wolthers.com/meeting/response/reschedule?token=reschedule-token-789'
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-meeting-request-abc',
        from: 'trips@trips.wolthers.com',
        to: ['host@meeting.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      const result = await sendHostMeetingRequestEmail(meetingRequestData.hostEmail, meetingRequestData)

      expect(result.success).toBe(true)
      expect(result.id).toBe('email-meeting-request-abc')

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      // Verify meeting details
      expect(emailCall.html).toContain('Quarterly Review')
      expect(emailCall.html).toContain('2:00 PM')
      expect(emailCall.html).toContain('90 minutes')
      expect(emailCall.html).toContain('Conference Room B')
      expect(emailCall.html).toContain('Q1 performance and Q2 planning')
      
      // Verify response URLs
      expect(emailCall.html).toContain('accept-token-123')
      expect(emailCall.html).toContain('decline-token-456')
      expect(emailCall.html).toContain('reschedule-token-789')
      
      // Verify team information
      expect(emailCall.html).toContain('Lead Analyst')
      expect(emailCall.html).toContain('Project Coordinator')
    })

    it('should generate proper call-to-action buttons for meeting responses', async () => {
      const meetingData: HostMeetingRequestData = {
        hostName: 'CTA Host',
        hostEmail: 'cta@host.com',
        companyName: 'CTA Company',
        meetingTitle: 'CTA Meeting',
        meetingDate: '2024-04-01T10:00:00Z',
        meetingTime: '10:00 AM',
        wolthersTeam: [],
        tripTitle: 'CTA Trip',
        tripAccessCode: 'CTA_001',
        inviterName: 'CTA Manager',
        inviterEmail: 'manager@wolthers.com',
        acceptUrl: 'https://app.wolthers.com/meeting/response/accept?token=accept-cta',
        declineUrl: 'https://app.wolthers.com/meeting/response/decline?token=decline-cta',
        rescheduleUrl: 'https://app.wolthers.com/meeting/response/reschedule?token=reschedule-cta'
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-cta-buttons-123',
        from: 'trips@trips.wolthers.com',
        to: ['cta@host.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      await sendHostMeetingRequestEmail(meetingData.hostEmail, meetingData)

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      // Verify button styling and structure
      expect(emailCall.html).toMatch(/<a[^>]+href="[^"]*accept-cta[^"]*"[^>]*>[\s\S]*?Accept[\s\S]*?<\/a>/i)
      expect(emailCall.html).toMatch(/<a[^>]+href="[^"]*decline-cta[^"]*"[^>]*>[\s\S]*?Decline[\s\S]*?<\/a>/i)
      expect(emailCall.html).toMatch(/<a[^>]+href="[^"]*reschedule-cta[^"]*"[^>]*>[\s\S]*?Reschedule[\s\S]*?<\/a>/i)
      
      // Verify buttons have proper styling classes or inline styles
      expect(emailCall.html).toMatch(/style="[^"]*background[^"]*"|class="[^"]*button[^"]*"/i)
    })
  })

  describe('Error Handling and Resilience Tests', () => {
    
    it('should handle API authentication failures', async () => {
      const authError = new Error('Invalid API key')
      ;(authError as any).status = 401
      mockSendMethod.mockRejectedValue(authError)

      const result = await sendStaffInvitationEmail('test@wolthers.com', {
        inviterName: 'Test',
        inviterEmail: 'test@wolthers.com',
        newStaffName: 'Test Staff',
        role: 'Test Role'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid API key')
    })

    it('should handle network connectivity issues', async () => {
      const networkError = new Error('Network timeout')
      ;(networkError as any).code = 'ETIMEDOUT'
      mockSendMethod.mockRejectedValue(networkError)

      const result = await sendHostInvitationEmail('test@client.com', {
        hostName: 'Test Host',
        hostEmail: 'test@client.com',
        companyName: 'Test Company',
        tripTitle: 'Test Trip',
        tripAccessCode: 'TEST_001',
        tripStartDate: '2024-01-20',
        tripEndDate: '2024-01-20',
        inviterName: 'Test Organizer',
        inviterEmail: 'organizer@wolthers.com',
        wolthersTeam: [],
        confirmationUrl: 'https://test.com/confirm',
        platformLoginUrl: 'https://test.com/login',
        visitingCompanyName: 'Test Visitors',
        visitDate: 'Test Date',
        visitTime: 'Test Time'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network timeout')
    })

    it('should handle Resend service unavailable', async () => {
      const serviceError = new Error('Service temporarily unavailable')
      ;(serviceError as any).status = 503
      mockSendMethod.mockRejectedValue(serviceError)

      const result = await sendGuestItineraryEmail('guest@company.com', {
        guestName: 'Test Guest',
        guestEmail: 'guest@company.com',
        tripTitle: 'Test Trip',
        tripAccessCode: 'TEST_001',
        tripStartDate: '2024-01-20',
        tripEndDate: '2024-01-20',
        createdBy: 'Test Creator',
        itinerary: [],
        emergencyContacts: []
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Service temporarily unavailable')
      expect(result.shouldRetry).toBe(true)
    })

    it('should validate email addresses before sending', async () => {
      const invalidEmails = [
        'invalid-email',
        '@invalid.com',
        'test@',
        '',
        'test space@email.com'
      ]

      for (const invalidEmail of invalidEmails) {
        const result = await sendStaffInvitationEmail(invalidEmail, {
          inviterName: 'Test',
          inviterEmail: 'valid@wolthers.com',
          newStaffName: 'Test Staff',
          role: 'Test Role'
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid email address')
      }
    })

    it('should handle large email content gracefully', async () => {
      // Create extremely large itinerary
      const largeItinerary: GuestItineraryData = {
        guestName: 'Large Content Guest',
        guestEmail: 'large@guest.com',
        tripTitle: 'Extended Conference with Many Sessions',
        tripAccessCode: 'LARGE_CONTENT_001',
        tripStartDate: '2024-05-01',
        tripEndDate: '2024-05-30',
        createdBy: 'Conference Organizer',
        itinerary: Array.from({ length: 30 }, (_, dayIndex) => ({
          date: `2024-05-${String(dayIndex + 1).padStart(2, '0')}`,
          activities: Array.from({ length: 10 }, (_, actIndex) => ({
            time: `${9 + actIndex}:00 AM`,
            title: `Session ${actIndex + 1} on Day ${dayIndex + 1}: ${'Very '.repeat(50)}Long Title`,
            location: `Room ${actIndex + 1}`,
            duration: '60 minutes',
            type: 'meeting' as const,
            description: 'Detailed description that goes on and on and on... '.repeat(100)
          }))
        })),
        emergencyContacts: Array.from({ length: 20 }, (_, i) => ({
          name: `Emergency Contact ${i + 1}`,
          role: `Role ${i + 1}`,
          email: `contact${i + 1}@emergency.com`,
          phone: `+55 11 9999-${String(i).padStart(4, '0')}`
        })),
        specialInstructions: 'Special instructions that are very long and detailed... '.repeat(200)
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-large-content-123',
        from: 'trips@trips.wolthers.com',
        to: ['large@guest.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      const result = await sendGuestItineraryEmail(largeItinerary.guestEmail, largeItinerary)

      expect(result.success).toBe(true)
      expect(result.id).toBe('email-large-content-123')

      // Verify that content is properly handled (not truncated inappropriately)
      const emailCall = mockSendMethod.mock.calls[0][0]
      expect(emailCall.html.length).toBeGreaterThan(10000) // Should be a large email
    })
  })

  describe('Email Template Validation Tests', () => {
    
    it('should generate valid HTML with proper encoding', async () => {
      const dataWithSpecialChars: HostInvitationEmailData = {
        hostName: 'José & María',
        hostEmail: 'jose@empresa.com.br',
        companyName: 'Inovação & Tecnologia Ltda.',
        tripTitle: 'Reunião "Estratégica" 2024',
        tripAccessCode: 'RU_EST_2024',
        tripStartDate: '2024-06-15',
        tripEndDate: '2024-06-17',
        inviterName: 'Carlos Müller',
        inviterEmail: 'carlos@wolthers.com',
        wolthersTeam: [{ name: 'Ângela Santos', role: 'Consultora Sênior' }],
        confirmationUrl: 'https://app.wolthers.com/host/confirm/test-123',
        platformLoginUrl: 'https://app.wolthers.com/host/login',
        visitingCompanyName: 'Wolthers & Associates',
        visitDate: 'Sábado, 15 de junho de 2024',
        visitTime: '14:30'
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-special-chars-123',
        from: 'trips@trips.wolthers.com',
        to: ['jose@empresa.com.br'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      await sendHostInvitationEmail(dataWithSpecialChars.hostEmail, dataWithSpecialChars)

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      // Verify special characters are properly encoded
      expect(emailCall.html).toContain('José &amp; María')
      expect(emailCall.html).toContain('&quot;Estratégica&quot;')
      expect(emailCall.html).toContain('Ângela Santos')
      
      // Verify HTML structure is valid
      expect(emailCall.html).toMatch(/<html[\s\S]*<\/html>/)
      expect(emailCall.html).toMatch(/<head[\s\S]*<\/head>/)
      expect(emailCall.html).toMatch(/<body[\s\S]*<\/body>/)
    })

    it('should include proper email headers and metadata', async () => {
      const emailData: StaffInvitationEmailData = {
        inviterName: 'Header Test Manager',
        inviterEmail: 'manager@wolthers.com',
        newStaffName: 'Header Test Staff',
        role: 'Test Role'
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-headers-test-123',
        from: 'trips@trips.wolthers.com',
        to: ['staff@wolthers.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      await sendStaffInvitationEmail('staff@wolthers.com', emailData)

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      // Verify email has proper structure
      expect(emailCall.from).toBe('trips@trips.wolthers.com')
      expect(emailCall.to).toEqual(['staff@wolthers.com'])
      expect(emailCall.subject).toBeTruthy()
      expect(emailCall.html).toBeTruthy()
      expect(emailCall.text).toBeTruthy()
      
      // Verify HTML has proper meta tags
      expect(emailCall.html).toMatch(/<meta[^>]+charset/i)
      expect(emailCall.html).toMatch(/<meta[^>]+viewport/i)
    })

    it('should generate mobile-responsive email templates', async () => {
      const mobileTestData: HostMeetingRequestData = {
        hostName: 'Mobile Host',
        hostEmail: 'mobile@host.com',
        companyName: 'Mobile Company',
        meetingTitle: 'Mobile Meeting Test',
        meetingDate: '2024-04-01T10:00:00Z',
        meetingTime: '10:00 AM',
        wolthersTeam: [],
        tripTitle: 'Mobile Trip',
        tripAccessCode: 'MOB_001',
        inviterName: 'Mobile Manager',
        inviterEmail: 'manager@wolthers.com',
        acceptUrl: 'https://app.wolthers.com/meeting/response/accept?token=mobile-accept',
        declineUrl: 'https://app.wolthers.com/meeting/response/decline?token=mobile-decline',
        rescheduleUrl: 'https://app.wolthers.com/meeting/response/reschedule?token=mobile-reschedule'
      }

      mockSendMethod.mockResolvedValue({
        id: 'email-mobile-responsive-123',
        from: 'trips@trips.wolthers.com',
        to: ['mobile@host.com'],
        created_at: '2024-01-15T10:00:00.000Z'
      })

      await sendHostMeetingRequestEmail(mobileTestData.hostEmail, mobileTestData)

      const emailCall = mockSendMethod.mock.calls[0][0]
      
      // Verify mobile-responsive elements
      expect(emailCall.html).toMatch(/media="screen and \(max-width:|@media \(max-width:/i)
      expect(emailCall.html).toMatch(/width:\s*100%/i)
      expect(emailCall.html).toMatch(/table-layout:\s*fixed|max-width:\s*600px/i)
    })
  })

  describe('Performance and Batching Tests', () => {
    
    it('should handle multiple concurrent email sends efficiently', async () => {
      const emailPromises = Array.from({ length: 10 }, (_, i) => {
        mockSendMethod.mockResolvedValueOnce({
          id: `email-concurrent-${i}`,
          from: 'trips@trips.wolthers.com',
          to: [`test${i}@wolthers.com`],
          created_at: '2024-01-15T10:00:00.000Z'
        })

        return sendStaffInvitationEmail(`test${i}@wolthers.com`, {
          inviterName: 'Concurrent Test Manager',
          inviterEmail: 'manager@wolthers.com',
          newStaffName: `Staff Member ${i}`,
          role: 'Test Role'
        })
      })

      const results = await Promise.all(emailPromises)

      // All should succeed
      expect(results.every(r => r.success)).toBe(true)
      expect(mockSendMethod).toHaveBeenCalledTimes(10)
    })

    it('should track email send timing for performance monitoring', async () => {
      const startTime = Date.now()

      mockSendMethod.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            id: 'email-timing-test-123',
            from: 'trips@trips.wolthers.com',
            to: ['timing@test.com'],
            created_at: '2024-01-15T10:00:00.000Z'
          }), 100) // Simulate 100ms delay
        })
      )

      const result = await sendStaffInvitationEmail('timing@test.com', {
        inviterName: 'Timing Test',
        inviterEmail: 'test@wolthers.com',
        newStaffName: 'Test Staff',
        role: 'Test Role'
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeGreaterThanOrEqual(100)
      expect(result.sendDuration).toBeGreaterThanOrEqual(100)
    })
  })
})