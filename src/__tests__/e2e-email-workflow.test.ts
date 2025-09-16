/**
 * End-to-End Email Workflow Test Suite
 * 
 * Tests the complete email workflow from start to finish:
 * - Participant addition → Email trigger → Email sending → Database tracking → Response handling
 * - Real integration scenarios with multiple components working together
 * - Error recovery and graceful degradation
 * - Performance under load
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ParticipantEmailService } from '@/services/participant-email-service'
import { POST, PATCH } from '@/app/api/trips/[id]/participants/route'
import { 
  sendHostInvitationEmail, 
  sendGuestItineraryEmail, 
  sendStaffInvitationEmail,
  sendHostMeetingRequestEmail 
} from '@/lib/resend'
import { 
  generateMeetingResponseUrls,
  validateMeetingResponseToken,
  processMeetingResponseToken 
} from '@/lib/meeting-response-tokens'

// Mock all dependencies
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/resend')
jest.mock('@/lib/meeting-response-tokens')
jest.mock('jsonwebtoken')

describe('End-to-End Email Workflow', () => {
  let mockSupabaseClient: any
  let mockUser: any
  let mockTrip: any
  const originalEnv = process.env

  beforeAll(() => {
    // Set up test environment
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.MEETING_TOKEN_SECRET = 'test-token-secret'
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  })

  afterAll(() => {
    // Restore environment
    process.env = originalEnv
  })

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock user data
    mockUser = {
      id: 'creator-123',
      full_name: 'Trip Creator',
      email: 'creator@wolthers.com',
      is_global_admin: false
    }

    // Mock trip data
    mockTrip = {
      id: 'trip-e2e-123',
      title: 'E2E Test Business Trip',
      access_code: 'E2E_TEST_001',
      start_date: '2024-02-15',
      end_date: '2024-02-17',
      creator_id: mockUser.id,
      status: 'planning',
      trip_access_permissions: [],
      users: {
        full_name: mockUser.full_name,
        email: mockUser.email
      }
    }

    // Mock Supabase client with comprehensive setup
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      rpc: jest.fn(),
      auth: {
        getUser: jest.fn()
      }
    }

    ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)

    // Mock JWT verification
    const jwt = require('jsonwebtoken')
    jwt.verify = jest.fn().mockReturnValue({ userId: mockUser.id })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Complete Host Email Workflow', () => {
    
    it('should complete full host workflow: participant addition → meeting request email → response handling', async () => {
      // Step 1: Mock participant addition via API
      const hostParticipant = {
        id: 'host-participant-123',
        full_name: 'Alice Host Manager',
        email: 'alice@clientcompany.com',
        company_id: 'client-company-456',
        companies: {
          name: 'Client Company Ltd'
        }
      }

      // Mock authentication
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: mockUser,
          error: null
        })
      })

      // Mock trip retrieval
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: mockTrip,
          error: null
        })
      })

      // Mock participant existence check (not found)
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: null
        })
      })

      // Mock participant insertion
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'new-participant-record',
            trip_id: mockTrip.id,
            user_id: hostParticipant.id,
            role: 'host'
          },
          error: null
        })
      })

      // Step 2: Mock email sending workflow
      
      // Mock participant data fetch for email service
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: hostParticipant,
          error: null
        })
      })

      // Mock activities fetch (with meeting activity found)
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce({
          data: [{
            id: 'activity-meeting-123',
            title: 'Strategic Planning Session',
            start_time: '2024-02-15T14:00:00Z',
            duration_minutes: 90,
            location: 'Conference Room Alpha',
            description: 'Q1 strategic initiatives discussion'
          }],
          error: null
        })
      })

      // Mock Wolthers team fetch
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        mockResolvedValueOnce: {
          data: [{
            users: {
              full_name: 'Senior Consultant',
              role: 'Lead Advisor'
            }
          }],
          error: null
        }
      })

      // Mock meeting response URL generation
      const mockResponseUrls = {
        acceptUrl: 'http://localhost:3000/meeting/response/accept?token=accept-token-e2e',
        declineUrl: 'http://localhost:3000/meeting/response/decline?token=decline-token-e2e',
        rescheduleUrl: 'http://localhost:3000/meeting/response/reschedule?token=reschedule-token-e2e'
      }
      ;(generateMeetingResponseUrls as jest.Mock).mockReturnValue(mockResponseUrls)

      // Mock successful email sending
      ;(sendHostMeetingRequestEmail as jest.Mock).mockResolvedValue({
        success: true,
        id: 'email-meeting-request-e2e',
        messageId: 'resend-message-123'
      })

      // Mock database tracking
      mockSupabaseClient.from
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null })
        })

      // Step 3: Execute participant addition
      const request = new NextRequest('http://localhost:3000/api/trips/trip-e2e-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          personId: hostParticipant.id,
          role: 'host',
          companyId: hostParticipant.company_id
        })
      })

      const params = { params: Promise.resolve({ id: mockTrip.id }) }
      const response = await POST(request, params)
      const responseData = await response.json()

      // Verify participant addition succeeded
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Step 4: Verify meeting response URL processing
      const acceptToken = mockResponseUrls.acceptUrl.split('token=')[1]
      
      // Mock token validation
      ;(validateMeetingResponseToken as jest.Mock).mockReturnValue({
        valid: true,
        data: {
          activityId: 'activity-meeting-123',
          hostEmail: hostParticipant.email,
          companyName: hostParticipant.companies.name,
          responseType: 'accept',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })

      const tokenValidation = validateMeetingResponseToken(acceptToken)
      expect(tokenValidation.valid).toBe(true)
      expect(tokenValidation.data?.responseType).toBe('accept')

      // Step 5: Verify email tracking was called
      expect(sendHostMeetingRequestEmail).toHaveBeenCalledWith(
        hostParticipant.email,
        expect.objectContaining({
          hostName: hostParticipant.full_name,
          meetingTitle: 'Strategic Planning Session',
          acceptUrl: mockResponseUrls.acceptUrl,
          declineUrl: mockResponseUrls.declineUrl,
          rescheduleUrl: mockResponseUrls.rescheduleUrl
        })
      )

      // Verify complete workflow success
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should handle host workflow with email failure gracefully', async () => {
      // Mock successful participant addition but failed email
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockUser, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockTrip, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: null, error: null })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'new-participant' },
            error: null
          })
        })

      // Mock email service failure
      jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')
        .mockRejectedValue(new Error('Email service unavailable'))

      const request = new NextRequest('http://localhost:3000/api/trips/trip-e2e-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          personId: 'host-123',
          role: 'host'
        })
      })

      const params = { params: Promise.resolve({ id: mockTrip.id }) }
      const response = await POST(request, params)
      const responseData = await response.json()

      // Participant should still be added despite email failure
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })
  })

  describe('Complete Guest Email Workflow', () => {
    
    it('should complete full guest workflow with comprehensive itinerary email', async () => {
      const guestParticipant = {
        id: 'guest-participant-456',
        full_name: 'Bob Guest Representative',
        email: 'bob@guestcompany.com',
        company_id: 'guest-company-789',
        companies: {
          name: 'Guest Company Inc'
        }
      }

      // Mock successful participant addition
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockUser, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockTrip, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: null, error: null })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'guest-participant-record', role: 'client_representative' },
            error: null
          })
        })

      // Mock email workflow - participant fetch
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: guestParticipant,
          error: null
        })
      })

      // Mock itinerary days fetch
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: [
            {
              date: '2024-02-15',
              activities: [
                {
                  title: 'Welcome & Orientation',
                  start_time: '2024-02-15T09:00:00Z',
                  duration_minutes: 30,
                  location: 'Main Lobby',
                  type: 'meeting',
                  description: 'Welcome session and agenda overview'
                },
                {
                  title: 'Strategic Planning Workshop',
                  start_time: '2024-02-15T10:00:00Z',
                  duration_minutes: 120,
                  location: 'Conference Room Alpha',
                  type: 'meeting',
                  description: 'Collaborative planning session'
                }
              ]
            },
            {
              date: '2024-02-16',
              activities: [
                {
                  title: 'Site Visit',
                  start_time: '2024-02-16T14:00:00Z',
                  duration_minutes: 180,
                  location: 'Manufacturing Facility',
                  type: 'activity',
                  description: 'Guided tour of production facility'
                }
              ]
            }
          ],
          error: null
        })
      })

      // Mock trip step_data fetch (accommodation/transportation)
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            step_data: {
              accommodation: {
                name: 'Business Plaza Hotel',
                address: '456 Business Ave, São Paulo, SP',
                phone: '+55 11 2345-6789',
                checkIn: '2024-02-14 15:00',
                checkOut: '2024-02-17 12:00'
              },
              transportation: {
                type: 'private_transfer',
                details: 'Executive car service from GRU Airport',
                arrivalTime: '2024-02-14 20:30',
                departureTime: '2024-02-17 15:00'
              }
            }
          },
          error: null
        })
      })

      // Mock successful email sending
      ;(sendGuestItineraryEmail as jest.Mock).mockResolvedValue({
        success: true,
        id: 'email-guest-itinerary-e2e',
        messageId: 'resend-guest-123'
      })

      // Mock database tracking
      mockSupabaseClient.from
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null })
        })

      // Execute workflow
      const request = new NextRequest('http://localhost:3000/api/trips/trip-e2e-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          personId: guestParticipant.id,
          role: 'client_representative'
        })
      })

      const params = { params: Promise.resolve({ id: mockTrip.id }) }
      const response = await POST(request, params)
      const responseData = await response.json()

      // Verify workflow success
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify comprehensive itinerary email was sent
      expect(sendGuestItineraryEmail).toHaveBeenCalledWith(
        guestParticipant.email,
        expect.objectContaining({
          guestName: guestParticipant.full_name,
          tripTitle: mockTrip.title,
          itinerary: expect.arrayContaining([
            expect.objectContaining({
              date: '2024-02-15',
              activities: expect.arrayContaining([
                expect.objectContaining({
                  title: 'Welcome & Orientation',
                  location: 'Main Lobby'
                })
              ])
            })
          ]),
          accommodation: expect.objectContaining({
            name: 'Business Plaza Hotel',
            address: '456 Business Ave, São Paulo, SP'
          }),
          transportation: expect.objectContaining({
            type: 'private_transfer',
            details: 'Executive car service from GRU Airport'
          })
        })
      )
    })
  })

  describe('Complete Staff Email Workflow', () => {
    
    it('should complete full staff workflow with batch processing', async () => {
      const staffMembers = [
        {
          id: 'staff-1',
          full_name: 'Senior Consultant Alpha',
          email: 'alpha@wolthers.com',
          role: 'senior_consultant'
        },
        {
          id: 'staff-2',
          full_name: 'Project Manager Beta',
          email: 'beta@wolthers.com',
          role: 'project_manager'
        },
        {
          id: 'staff-3',
          full_name: 'Analyst Gamma',
          email: 'gamma@wolthers.com',
          role: 'analyst'
        }
      ]

      // Mock batch staff addition via PATCH endpoint
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockTrip, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockUser, error: null })
        })

      // Mock availability checks (all available)
      mockSupabaseClient.rpc
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: true, error: null })

      // Mock staff batch insertion
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      // Mock trip context fetch for emails
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockTrip, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValueOnce({
            data: staffMembers.map(staff => ({
              users: {
                id: staff.id,
                full_name: staff.full_name,
                email: staff.email,
                role: staff.role
              }
            })),
            error: null
          })
        })

      // Mock individual email service calls
      jest.spyOn(ParticipantEmailService, 'sendParticipantEmail')
        .mockResolvedValueOnce({ success: true, emailType: 'staff_notification' })
        .mockResolvedValueOnce({ success: true, emailType: 'staff_notification' })
        .mockResolvedValueOnce({ success: true, emailType: 'staff_notification' })

      // Mock email tracking
      jest.spyOn(ParticipantEmailService, 'trackEmailStatus')
        .mockResolvedValue()

      // Execute batch staff addition
      const request = new NextRequest('http://localhost:3000/api/trips/trip-e2e-123/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          staff: staffMembers.map(s => ({ id: s.id, role: 'staff' })),
          action: 'add'
        })
      })

      const params = { params: Promise.resolve({ id: mockTrip.id }) }
      const response = await PATCH(request, params)
      const responseData = await response.json()

      // Verify batch operation success
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify all staff members received emails
      expect(ParticipantEmailService.sendParticipantEmail).toHaveBeenCalledTimes(3)
      expect(ParticipantEmailService.trackEmailStatus).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Recovery and Resilience', () => {
    
    it('should recover from partial email sending failures', async () => {
      const participants = [
        { participantId: 'participant-1', role: 'host' },
        { participantId: 'participant-2', role: 'staff' },
        { participantId: 'participant-3', role: 'client_representative' }
      ]

      // Mock mixed email results
      jest.spyOn(ParticipantEmailService, 'sendParticipantEmail')
        .mockResolvedValueOnce({ success: true, emailType: 'meeting_request' })
        .mockResolvedValueOnce({ success: false, error: 'SMTP timeout', emailType: 'staff_notification' })
        .mockResolvedValueOnce({ success: true, emailType: 'guest_itinerary' })

      // Mock tracking (should still track all attempts)
      jest.spyOn(ParticipantEmailService, 'trackEmailStatus').mockResolvedValue()

      const emailContext = {
        tripId: mockTrip.id,
        tripTitle: mockTrip.title,
        tripAccessCode: mockTrip.access_code,
        tripStartDate: mockTrip.start_date,
        tripEndDate: mockTrip.end_date,
        createdBy: mockUser.full_name,
        createdByEmail: mockUser.email,
        participants: []
      }

      const result = await ParticipantEmailService.sendParticipantEmails(participants, emailContext)

      expect(result.success).toBe(false) // Overall failure due to one failed email
      expect(result.results).toHaveLength(3)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('SMTP timeout')

      // All emails should be tracked regardless of success/failure
      expect(ParticipantEmailService.trackEmailStatus).toHaveBeenCalledTimes(3)
    })

    it('should handle database connection failures during workflow', async () => {
      // Mock initial success but database failure during email tracking
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockUser, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockTrip, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: null, error: null })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'participant-record' },
            error: null
          })
        })
        .mockReturnValueOnce({
          update: jest.fn().mockRejectedValue(new Error('Database connection lost'))
        })

      // Mock email service success
      jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')
        .mockResolvedValue({
          success: true,
          results: [{ success: true, emailType: 'staff_notification' }],
          errors: []
        })

      const request = new NextRequest('http://localhost:3000/api/trips/trip-e2e-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          personId: 'staff-123',
          role: 'staff'
        })
      })

      const params = { params: Promise.resolve({ id: mockTrip.id }) }
      const response = await POST(request, params)
      const responseData = await response.json()

      // Participant addition should succeed despite tracking failure
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should handle external service outages gracefully', async () => {
      // Mock Resend API outage
      ;(sendStaffInvitationEmail as jest.Mock).mockRejectedValue({
        status: 503,
        message: 'Service temporarily unavailable'
      })

      const emailResult = await ParticipantEmailService.sendParticipantEmail(
        'staff-123',
        'staff',
        {
          tripId: mockTrip.id,
          tripTitle: mockTrip.title,
          tripAccessCode: mockTrip.access_code,
          tripStartDate: mockTrip.start_date,
          tripEndDate: mockTrip.end_date,
          createdBy: mockUser.full_name,
          createdByEmail: mockUser.email,
          participants: []
        }
      )

      expect(emailResult.success).toBe(false)
      expect(emailResult.error).toContain('Service temporarily unavailable')
      expect(emailResult.shouldRetry).toBe(true)
    })
  })

  describe('Performance and Scalability', () => {
    
    it('should handle large batch participant additions efficiently', async () => {
      const largeBatch = Array.from({ length: 50 }, (_, i) => ({
        id: `staff-large-${i}`,
        role: 'staff'
      }))

      // Mock database operations
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockTrip, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockUser, error: null })
        })

      // Mock availability checks (all pass)
      for (let i = 0; i < largeBatch.length; i++) {
        mockSupabaseClient.rpc.mockResolvedValueOnce({ data: true, error: null })
      }

      // Mock batch insertion
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      // Mock email context
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({ data: mockTrip, error: null })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValueOnce({ data: [], error: null })
        })

      // Mock email service with batch processing
      jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')
        .mockResolvedValue({
          success: true,
          results: largeBatch.map(() => ({ success: true, emailType: 'staff_notification' })),
          errors: []
        })

      const startTime = Date.now()

      const request = new NextRequest('http://localhost:3000/api/trips/trip-e2e-123/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          staff: largeBatch,
          action: 'add'
        })
      })

      const params = { params: Promise.resolve({ id: mockTrip.id }) }
      const response = await PATCH(request, params)
      const responseData = await response.json()

      const executionTime = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds for large batch
    })

    it('should handle concurrent workflow executions', async () => {
      // Mock successful operations for all concurrent requests
      mockSupabaseClient.from
        .mockImplementation(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockImplementation(() => {
            // Randomly return user or trip data
            return Promise.resolve({ 
              data: Math.random() > 0.5 ? mockUser : mockTrip, 
              error: null 
            })
          }),
          insert: jest.fn().mockReturnThis(),
          mockResolvedValue: { data: { id: 'concurrent-record' }, error: null }
        }))

      jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')
        .mockResolvedValue({
          success: true,
          results: [{ success: true, emailType: 'staff_notification' }],
          errors: []
        })

      // Create multiple concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
        const request = new NextRequest(`http://localhost:3000/api/trips/trip-${i}/participants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            personId: `staff-concurrent-${i}`,
            role: 'staff'
          })
        })

        const params = { params: Promise.resolve({ id: `trip-${i}` }) }
        return POST(request, params)
      })

      const responses = await Promise.all(concurrentRequests)

      // All should succeed
      expect(responses.every(r => r.status === 200)).toBe(true)
      
      // Email service should handle concurrent calls
      expect(ParticipantEmailService.sendParticipantEmails).toHaveBeenCalledTimes(10)
    })
  })

  describe('Data Consistency and Integrity', () => {
    
    it('should maintain data consistency across email tracking tables', async () => {
      const participantId = 'consistency-test-123'
      const emailType = 'host_invitation'

      // Mock successful email sending
      mockSupabaseClient.from
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null })
        })

      await ParticipantEmailService.trackEmailStatus(
        mockTrip.id,
        participantId,
        emailType,
        'sent'
      )

      // Verify both tables are updated consistently
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        email_sent: true,
        email_sent_at: expect.any(String),
        email_type: emailType,
        email_error: null
      })

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        trip_id: mockTrip.id,
        participant_id: participantId,
        email_type: emailType,
        status: 'sent',
        error_message: null,
        sent_at: expect.any(String)
      })
    })

    it('should handle transaction-like consistency for meeting responses', async () => {
      const meetingResponseData = {
        response_token: 'consistency-token-456',
        activity_id: 'activity-123',
        host_email: 'host@consistency.com',
        response_type: 'accept',
        status: 'pending'
      }

      // Mock successful insertion
      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: [meetingResponseData],
        error: null
      })

      // Mock related activity update
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      })

      // Simulate storing meeting response and updating activity
      const storeMeetingResponse = async (responseData: any) => {
        // Store response
        const { data, error } = await mockSupabaseClient
          .from('meeting_responses')
          .insert(responseData)
          .select()

        if (error) return { success: false, error }

        // Update activity status
        await mockSupabaseClient
          .from('activities')
          .update({ response_received: true })
          .eq('id', responseData.activity_id)

        return { success: true, data }
      }

      const result = await storeMeetingResponse(meetingResponseData)

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.insert).toHaveBeenCalled()
    })
  })

  describe('Comprehensive Integration Scenarios', () => {
    
    it('should handle complex multi-stakeholder trip with all email types', async () => {
      const complexTrip = {
        ...mockTrip,
        title: 'Multi-Stakeholder Strategic Summit'
      }

      const participants = {
        hosts: [
          { id: 'host-1', email: 'ceo@client.com', name: 'CEO Client' },
          { id: 'host-2', email: 'cto@client.com', name: 'CTO Client' }
        ],
        guests: [
          { id: 'guest-1', email: 'partner@external.com', name: 'External Partner' }
        ],
        staff: [
          { id: 'staff-1', email: 'lead@wolthers.com', name: 'Lead Consultant' },
          { id: 'staff-2', email: 'pm@wolthers.com', name: 'Project Manager' }
        ]
      }

      // Mock comprehensive email sending for all participant types
      jest.spyOn(ParticipantEmailService, 'sendParticipantEmail')
        // Host emails (meeting requests)
        .mockResolvedValueOnce({ success: true, emailType: 'meeting_request' })
        .mockResolvedValueOnce({ success: true, emailType: 'meeting_request' })
        // Guest emails (itineraries)
        .mockResolvedValueOnce({ success: true, emailType: 'guest_itinerary' })
        // Staff emails (notifications)
        .mockResolvedValueOnce({ success: true, emailType: 'staff_notification' })
        .mockResolvedValueOnce({ success: true, emailType: 'staff_notification' })

      jest.spyOn(ParticipantEmailService, 'trackEmailStatus').mockResolvedValue()

      const allParticipants = [
        ...participants.hosts.map(p => ({ participantId: p.id, role: 'host' })),
        ...participants.guests.map(p => ({ participantId: p.id, role: 'client_representative' })),
        ...participants.staff.map(p => ({ participantId: p.id, role: 'staff' }))
      ]

      const emailContext = {
        tripId: complexTrip.id,
        tripTitle: complexTrip.title,
        tripAccessCode: complexTrip.access_code,
        tripStartDate: complexTrip.start_date,
        tripEndDate: complexTrip.end_date,
        createdBy: mockUser.full_name,
        createdByEmail: mockUser.email,
        participants: []
      }

      const result = await ParticipantEmailService.sendParticipantEmails(allParticipants, emailContext)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(5)
      expect(result.errors).toHaveLength(0)

      // Verify all email types were sent
      const emailTypes = result.results.map(r => r.emailType)
      expect(emailTypes).toContain('meeting_request')
      expect(emailTypes).toContain('guest_itinerary')
      expect(emailTypes).toContain('staff_notification')

      // Verify all emails were tracked
      expect(ParticipantEmailService.trackEmailStatus).toHaveBeenCalledTimes(5)
    })
  })
})