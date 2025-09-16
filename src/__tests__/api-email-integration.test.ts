/**
 * API Email Integration Test Suite
 * 
 * Tests the API endpoints that trigger email sending when participants are added.
 * Focuses on the integration between REST API and email service layer.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { POST, PATCH } from '@/app/api/trips/[id]/participants/route'
import { ParticipantEmailService } from '@/services/participant-email-service'

// Mock dependencies
jest.mock('@/lib/supabase-server')
jest.mock('@/services/participant-email-service')
jest.mock('jsonwebtoken')

describe('API Email Integration Tests', () => {
  let mockRequest: NextRequest
  let mockParams: { params: Promise<{ id: string }> }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock request and params
    mockParams = {
      params: Promise.resolve({ id: 'trip-123' })
    }

    // Mock JWT verification to return valid user
    const jwt = require('jsonwebtoken')
    jwt.verify = jest.fn().mockReturnValue({
      userId: 'user-123'
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('POST /api/trips/[id]/participants - Add Single Participant', () => {
    
    it('should trigger email when adding staff participant', async () => {
      // Mock Supabase operations
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock user authentication
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'user-123',
            is_global_admin: false
          },
          error: null
        })
      })

      // Mock existing participant check (not found)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: null
        })
      })

      // Mock participant insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'new-participant-id',
            trip_id: 'trip-123',
            user_id: 'participant-user-123',
            role: 'staff'
          },
          error: null
        })
      })

      // Mock email service
      const emailServiceSpy = jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')
        .mockResolvedValue({
          success: true,
          results: [{ success: true, emailType: 'staff_notification' }],
          errors: []
        })

      // Create request
      const requestBody = {
        personId: 'participant-user-123',
        role: 'staff',
        companyId: '840783f4-866d-4bdb-9b5d-5d0facf62db0'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      // Execute API call
      const response = await POST(mockRequest, mockParams)
      const responseData = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify email service was called
      expect(emailServiceSpy).toHaveBeenCalledWith(
        'trip-123',
        expect.arrayContaining([
          expect.objectContaining({
            participantId: 'participant-user-123',
            role: 'staff'
          })
        ])
      )
    })

    it('should not fail participant addition if email sending fails', async () => {
      // Mock successful database operations
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock authentication and database operations (all successful)
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'user-123', is_global_admin: false },
            error: null
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: null, // No existing participant
            error: null
          })
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

      const requestBody = {
        personId: 'participant-user-123',
        role: 'host',
        companyId: 'client-company-456'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(mockRequest, mockParams)
      const responseData = await response.json()

      // Should still succeed - email failure doesn't break participant addition
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should handle duplicate participant addition gracefully', async () => {
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock authentication
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { id: 'user-123', is_global_admin: false },
          error: null
        })
      })

      // Mock existing participant found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'existing-participant',
            trip_id: 'trip-123',
            user_id: 'participant-user-123',
            role: 'staff'
          },
          error: null
        })
      })

      const emailServiceSpy = jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')

      const requestBody = {
        personId: 'participant-user-123',
        role: 'staff'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(mockRequest, mockParams)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('Participant already on trip')
      
      // Should not trigger email for duplicate
      expect(emailServiceSpy).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/trips/[id]/participants - Bulk Participant Updates', () => {
    
    it('should trigger emails when adding multiple staff members', async () => {
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        rpc: jest.fn()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock trip fetch and permissions
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'trip-123',
            creator_id: 'user-123',
            start_date: '2024-01-15',
            end_date: '2024-01-17',
            trip_access_permissions: []
          },
          error: null
        })
      })

      // Mock user authentication
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'user-123',
            is_global_admin: false
          },
          error: null
        })
      })

      // Mock availability checks (all available)
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: true, error: null })

      // Mock staff insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      // Mock trip context and participants for email
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'trip-123',
              title: 'Test Trip',
              access_code: 'TEST_001',
              start_date: '2024-01-15',
              end_date: '2024-01-17',
              users: {
                full_name: 'Trip Organizer',
                email: 'organizer@wolthers.com'
              }
            },
            error: null
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValueOnce({
            data: [
              {
                users: {
                  id: 'staff-1',
                  full_name: 'Staff One',
                  email: 'staff1@wolthers.com',
                  role: 'consultant'
                }
              }
            ],
            error: null
          })
        })

      // Mock email service
      const emailServiceSpy = jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')
        .mockResolvedValue({
          success: true,
          results: [
            { success: true, emailType: 'staff_notification' },
            { success: true, emailType: 'staff_notification' }
          ],
          errors: []
        })

      const requestBody = {
        staff: [
          { id: 'staff-1', role: 'staff' },
          { id: 'staff-2', role: 'staff' }
        ],
        action: 'add'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await PATCH(mockRequest, mockParams)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify email service was called with both staff members
      expect(emailServiceSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          { participantId: 'staff-1', role: 'staff' },
          { participantId: 'staff-2', role: 'staff' }
        ]),
        expect.objectContaining({
          tripId: 'trip-123',
          tripTitle: 'Test Trip'
        })
      )
    })

    it('should not trigger emails when removing participants', async () => {
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock authentication and permissions
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'trip-123',
              creator_id: 'user-123',
              trip_access_permissions: []
            },
            error: null
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'user-123', is_global_admin: false },
            error: null
          })
        })

      // Mock participant removal
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null })
      })

      const emailServiceSpy = jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')

      const requestBody = {
        staff: [{ id: 'staff-1', role: 'staff' }],
        action: 'remove'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await PATCH(mockRequest, mockParams)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Should not trigger emails for removal
      expect(emailServiceSpy).not.toHaveBeenCalled()
    })

    it('should handle mixed guest and staff participant updates', async () => {
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        rpc: jest.fn()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock authentication and permissions
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'trip-123',
              creator_id: 'user-123',
              start_date: '2024-01-15',
              end_date: '2024-01-17',
              trip_access_permissions: []
            },
            error: null
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'user-123', is_global_admin: false },
            error: null
          })
        })

      // Mock availability check for staff
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null })

      // Mock staff insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      // Mock current trip data for guest updates
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            step_data: { guests: [] }
          },
          error: null
        })
      })

      // Mock trip update for guests
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockResolvedValue({ error: null })
      })

      // Mock email context data
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'trip-123',
              title: 'Mixed Participants Trip',
              access_code: 'MIXED_001',
              start_date: '2024-01-15',
              end_date: '2024-01-17',
              users: {
                full_name: 'Trip Organizer',
                email: 'organizer@wolthers.com'
              }
            },
            error: null
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValueOnce({
            data: [],
            error: null
          })
        })

      const emailServiceSpy = jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')
        .mockResolvedValue({
          success: true,
          results: [{ success: true, emailType: 'staff_notification' }],
          errors: []
        })

      const requestBody = {
        staff: [{ id: 'staff-1', role: 'staff' }],
        guests: [
          {
            id: 'guest-1',
            name: 'Guest Representative',
            email: 'guest@client.com',
            company_id: 'client-company'
          }
        ],
        action: 'add'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await PATCH(mockRequest, mockParams)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Should trigger emails only for staff (guests handled separately)
      expect(emailServiceSpy).toHaveBeenCalledWith(
        [{ participantId: 'staff-1', role: 'staff' }],
        expect.objectContaining({
          tripId: 'trip-123'
        })
      )
    })
  })

  describe('Authentication and Authorization Tests', () => {
    
    it('should reject requests without authentication', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personId: 'participant-123',
          role: 'staff'
        })
      })

      const response = await POST(mockRequest, mockParams)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Authentication required')
    })

    it('should reject requests from unauthorized users', async () => {
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock unauthorized user
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'unauthorized-user',
            is_global_admin: false
          },
          error: null
        })
      })

      // Mock trip with different creator and no permissions
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'trip-123',
            creator_id: 'different-user',
            trip_access_permissions: []
          },
          error: null
        })
      })

      const requestBody = {
        staff: [{ id: 'staff-1', role: 'staff' }],
        action: 'add'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await PATCH(mockRequest, mockParams)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toBe('Permission denied')
    })
  })

  describe('Error Handling Tests', () => {
    
    it('should handle database connection failures gracefully', async () => {
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      const requestBody = {
        personId: 'participant-123',
        role: 'staff'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(mockRequest, mockParams)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
      expect(responseData.details).toContain('Database connection failed')
    })

    it('should handle staff availability conflicts', async () => {
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        rpc: jest.fn()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock authentication and permissions
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'trip-123',
              creator_id: 'user-123',
              start_date: '2024-01-15',
              end_date: '2024-01-17',
              trip_access_permissions: []
            },
            error: null
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'user-123', is_global_admin: false },
            error: null
          })
        })

      // Mock availability check failure (staff unavailable)
      mockSupabase.rpc.mockResolvedValue({ data: false, error: null })

      const requestBody = {
        staff: [{ id: 'staff-1', role: 'staff' }],
        action: 'add'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await PATCH(mockRequest, mockParams)
      const responseData = await response.json()

      expect(response.status).toBe(409)
      expect(responseData.error).toBe('Staff member has conflicting assignment')
    })

    it('should continue operation even when email tracking fails', async () => {
      // This test ensures that email tracking failures don't break the participant addition flow
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock successful database operations
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'user-123', is_global_admin: false },
            error: null
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: null,
            error: null
          })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'new-participant' },
            error: null
          })
        })

      // Mock email service with tracking failure
      jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')
        .mockResolvedValue({
          success: true,
          results: [{ success: true, emailType: 'staff_notification' }],
          errors: []
        })

      jest.spyOn(ParticipantEmailService, 'trackEmailStatus')
        .mockRejectedValue(new Error('Tracking table unavailable'))

      const requestBody = {
        personId: 'participant-123',
        role: 'staff'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(mockRequest, mockParams)
      const responseData = await response.json()

      // Should still succeed despite tracking failure
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })
  })

  describe('Performance and Rate Limiting Tests', () => {
    
    it('should handle large batch participant additions efficiently', async () => {
      const { createServerSupabaseClient } = require('@/lib/supabase-server')
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        rpc: jest.fn()
      }
      
      createServerSupabaseClient.mockReturnValue(mockSupabase)

      // Mock permissions
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'trip-123',
              creator_id: 'user-123',
              start_date: '2024-01-15',
              end_date: '2024-01-17',
              trip_access_permissions: []
            },
            error: null
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: { id: 'user-123', is_global_admin: false },
            error: null
          })
        })

      // Mock availability checks (all available)
      const largeStaffList = Array.from({ length: 20 }, (_, i) => ({ id: `staff-${i}`, role: 'staff' }))
      
      // Mock multiple availability checks
      for (let i = 0; i < largeStaffList.length; i++) {
        mockSupabase.rpc.mockResolvedValueOnce({ data: true, error: null })
      }

      // Mock batch insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      // Mock email context data
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce({
            data: {
              id: 'trip-123',
              title: 'Large Team Trip',
              access_code: 'LARGE_001',
              start_date: '2024-01-15',
              end_date: '2024-01-17',
              users: {
                full_name: 'Trip Organizer',
                email: 'organizer@wolthers.com'
              }
            },
            error: null
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValueOnce({
            data: [],
            error: null
          })
        })

      // Mock email service with batch processing
      const emailServiceSpy = jest.spyOn(ParticipantEmailService, 'sendParticipantEmails')
        .mockResolvedValue({
          success: true,
          results: largeStaffList.map(() => ({ success: true, emailType: 'staff_notification' })),
          errors: []
        })

      const requestBody = {
        staff: largeStaffList,
        action: 'add'
      }

      mockRequest = new NextRequest('http://localhost:3000/api/trips/trip-123/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(requestBody)
      })

      const startTime = Date.now()
      const response = await PATCH(mockRequest, mockParams)
      const endTime = Date.now()

      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      
      // Should handle large batches reasonably quickly (under 5 seconds for mocked operations)
      expect(endTime - startTime).toBeLessThan(5000)
      
      // Should call email service with all participants
      expect(emailServiceSpy).toHaveBeenCalledWith(
        largeStaffList,
        expect.any(Object)
      )
    })
  })
})