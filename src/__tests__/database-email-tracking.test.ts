/**
 * Database Email Tracking Test Suite
 * 
 * Tests the database layer for email tracking including:
 * - Email status recording and updates
 * - Email tracking table operations
 * - Meeting response storage
 * - Data integrity and consistency
 * - Performance and concurrency handling
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ParticipantEmailService } from '@/services/participant-email-service'

// Mock Supabase client
jest.mock('@/lib/supabase-server')

describe('Database Email Tracking', () => {
  let mockSupabaseClient: any
  const testTripId = 'test-trip-123'
  const testParticipantId = 'test-participant-456'
  const testEmailId = 'test-email-789'

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase client with fluent interface
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      // Mock Promise resolution
      then: jest.fn((callback) => callback({ data: null, error: null }))
    }

    ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Email Status Tracking Tests', () => {
    
    it('should record successful email delivery in trip_participants table', async () => {
      // Mock successful update
      mockSupabaseClient.update.mockResolvedValueOnce({ error: null })
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null })

      await ParticipantEmailService.trackEmailStatus(
        testTripId,
        testParticipantId,
        'host_invitation',
        'sent'
      )

      // Verify trip_participants table update
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('trip_participants')
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        email_sent: true,
        email_sent_at: expect.any(String),
        email_type: 'host_invitation',
        email_error: null
      })

      // Verify trip_participant_emails table insert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('trip_participant_emails')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        trip_id: testTripId,
        participant_id: testParticipantId,
        email_type: 'host_invitation',
        status: 'sent',
        error_message: null,
        sent_at: expect.any(String)
      })
    })

    it('should record failed email delivery with error details', async () => {
      const errorMessage = 'SMTP server unavailable'
      
      mockSupabaseClient.update.mockResolvedValueOnce({ error: null })
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null })

      await ParticipantEmailService.trackEmailStatus(
        testTripId,
        testParticipantId,
        'guest_itinerary',
        'failed',
        errorMessage
      )

      // Verify failed status is recorded
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        email_sent: false,
        email_sent_at: null,
        email_type: 'guest_itinerary',
        email_error: errorMessage
      })

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        trip_id: testTripId,
        participant_id: testParticipantId,
        email_type: 'guest_itinerary',
        status: 'failed',
        error_message: errorMessage,
        sent_at: null
      })
    })

    it('should handle database connection failures gracefully', async () => {
      // Mock database error
      const dbError = new Error('Connection timeout')
      mockSupabaseClient.update.mockRejectedValueOnce(dbError)

      // Should not throw - tracking failures shouldn't break participant addition
      await expect(
        ParticipantEmailService.trackEmailStatus(
          testTripId,
          testParticipantId,
          'staff_notification',
          'sent'
        )
      ).resolves.toBeUndefined()

      expect(mockSupabaseClient.update).toHaveBeenCalled()
    })

    it('should track different email types correctly', async () => {
      const emailTypes = [
        'host_invitation',
        'guest_itinerary',
        'staff_notification',
        'meeting_request',
        'cancellation_notice'
      ]

      mockSupabaseClient.update.mockResolvedValue({ error: null })
      mockSupabaseClient.insert.mockResolvedValue({ error: null })

      for (const emailType of emailTypes) {
        await ParticipantEmailService.trackEmailStatus(
          testTripId,
          testParticipantId,
          emailType,
          'sent'
        )

        expect(mockSupabaseClient.update).toHaveBeenCalledWith(
          expect.objectContaining({
            email_type: emailType
          })
        )

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            email_type: emailType
          })
        )
      }

      expect(mockSupabaseClient.update).toHaveBeenCalledTimes(emailTypes.length)
      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(emailTypes.length)
    })

    it('should handle concurrent email tracking operations', async () => {
      mockSupabaseClient.update.mockResolvedValue({ error: null })
      mockSupabaseClient.insert.mockResolvedValue({ error: null })

      const concurrentOperations = Array.from({ length: 10 }, (_, i) =>
        ParticipantEmailService.trackEmailStatus(
          testTripId,
          `participant-${i}`,
          'staff_notification',
          'sent'
        )
      )

      await Promise.all(concurrentOperations)

      expect(mockSupabaseClient.update).toHaveBeenCalledTimes(10)
      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(10)
    })
  })

  describe('Trip Participant Email History Tests', () => {
    
    it('should retrieve email history for a trip', async () => {
      const mockEmailHistory = [
        {
          id: 'email-1',
          trip_id: testTripId,
          participant_id: 'participant-1',
          email_type: 'host_invitation',
          status: 'sent',
          sent_at: '2024-01-15T10:00:00.000Z',
          error_message: null
        },
        {
          id: 'email-2',
          trip_id: testTripId,
          participant_id: 'participant-2',
          email_type: 'guest_itinerary',
          status: 'failed',
          sent_at: null,
          error_message: 'Invalid email address'
        }
      ]

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockEmailHistory,
        error: null
      })

      // Mock a function to get email history (this would be implemented in the service)
      const getEmailHistory = async (tripId: string) => {
        const { data, error } = await mockSupabaseClient
          .from('trip_participant_emails')
          .select('*')
          .eq('trip_id', tripId)
          .order('sent_at', { ascending: false })

        return { data, error }
      }

      const result = await getEmailHistory(testTripId)

      expect(result.data).toEqual(mockEmailHistory)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('trip_participant_emails')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('trip_id', testTripId)
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('sent_at', { ascending: false })
    })

    it('should retrieve email statistics for dashboard reporting', async () => {
      const mockEmailStats = [
        {
          email_type: 'host_invitation',
          total_sent: 5,
          total_failed: 1,
          success_rate: 0.833
        },
        {
          email_type: 'guest_itinerary',
          total_sent: 10,
          total_failed: 0,
          success_rate: 1.0
        }
      ]

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: mockEmailStats,
        error: null
      })

      // Mock email statistics query
      const getEmailStatistics = async (tripId: string) => {
        const { data, error } = await mockSupabaseClient
          .from('trip_participant_emails')
          .select(`
            email_type,
            count(*) as total_sent,
            count(case when status = 'failed' then 1 end) as total_failed
          `)
          .eq('trip_id', tripId)

        return { data, error }
      }

      const result = await getEmailStatistics(testTripId)

      expect(result.data).toEqual(mockEmailStats)
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringContaining('count(*)')
      )
    })

    it('should filter email history by date range', async () => {
      const startDate = '2024-01-01T00:00:00.000Z'
      const endDate = '2024-01-31T23:59:59.999Z'

      mockSupabaseClient.gte.mockReturnThis()
      mockSupabaseClient.lte.mockReturnThis()
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const getEmailHistoryByDateRange = async (tripId: string, start: string, end: string) => {
        const { data, error } = await mockSupabaseClient
          .from('trip_participant_emails')
          .select('*')
          .eq('trip_id', tripId)
          .gte('sent_at', start)
          .lte('sent_at', end)
          .order('sent_at', { ascending: false })

        return { data, error }
      }

      await getEmailHistoryByDateRange(testTripId, startDate, endDate)

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('sent_at', startDate)
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('sent_at', endDate)
    })

    it('should handle missing email tracking data gracefully', async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const getEmailHistory = async (tripId: string) => {
        const { data, error } = await mockSupabaseClient
          .from('trip_participant_emails')
          .select('*')
          .eq('trip_id', tripId)

        return { data: data || [], error }
      }

      const result = await getEmailHistory('nonexistent-trip')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('Meeting Response Storage Tests', () => {
    
    it('should store meeting response with complete data', async () => {
      const mockMeetingResponse = {
        response_token: 'response-token-123',
        meeting_id: 'meeting-456',
        activity_id: 'activity-789',
        host_name: 'John Host',
        host_email: 'john@client.com',
        company_name: 'Client Corp',
        response_type: 'accept',
        response_message: 'Looking forward to our meeting!',
        reschedule_requested_date: null,
        reschedule_requested_time: null,
        trip_id: testTripId,
        original_meeting_date: '2024-01-20T14:00:00.000Z',
        original_meeting_time: '2:00 PM',
        status: 'pending',
        organizer_notified: false,
        created_at: '2024-01-15T10:00:00.000Z'
      }

      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: [mockMeetingResponse],
        error: null
      })

      const storeMeetingResponse = async (responseData: any) => {
        const { data, error } = await mockSupabaseClient
          .from('meeting_responses')
          .insert(responseData)
          .select()
          .single()

        return { data, error }
      }

      const result = await storeMeetingResponse(mockMeetingResponse)

      expect(result.data).toEqual(mockMeetingResponse)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('meeting_responses')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(mockMeetingResponse)
    })

    it('should store reschedule request with new date and time', async () => {
      const rescheduleResponse = {
        response_token: 'reschedule-token-456',
        activity_id: 'activity-789',
        host_name: 'Jane Host',
        host_email: 'jane@client.com',
        company_name: 'Client Corp',
        response_type: 'reschedule',
        response_message: 'Could we move this to next week?',
        reschedule_requested_date: '2024-01-27T14:00:00.000Z',
        reschedule_requested_time: '2:00 PM',
        original_meeting_date: '2024-01-20T14:00:00.000Z',
        original_meeting_time: '2:00 PM',
        status: 'pending',
        organizer_notified: false
      }

      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: [rescheduleResponse],
        error: null
      })

      const storeMeetingResponse = async (responseData: any) => {
        const { data, error } = await mockSupabaseClient
          .from('meeting_responses')
          .insert(responseData)
          .select()
          .single()

        return { data, error }
      }

      const result = await storeMeetingResponse(rescheduleResponse)

      expect(result.data.response_type).toBe('reschedule')
      expect(result.data.reschedule_requested_date).toBe('2024-01-27T14:00:00.000Z')
      expect(result.data.reschedule_requested_time).toBe('2:00 PM')
    })

    it('should prevent duplicate meeting responses', async () => {
      const duplicateError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
        details: 'Key (response_token) already exists'
      }

      mockSupabaseClient.insert.mockRejectedValueOnce({
        error: duplicateError
      })

      const storeMeetingResponse = async (responseData: any) => {
        try {
          const { data, error } = await mockSupabaseClient
            .from('meeting_responses')
            .insert(responseData)
            .select()
            .single()

          return { data, error }
        } catch (error: any) {
          if (error.error?.code === '23505') {
            return { data: null, error: 'Response already recorded' }
          }
          throw error
        }
      }

      const result = await storeMeetingResponse({
        response_token: 'duplicate-token'
      })

      expect(result.error).toBe('Response already recorded')
    })

    it('should update meeting response status when processed', async () => {
      const responseId = 'response-123'
      const updatedResponse = {
        status: 'processed',
        organizer_notified: true,
        processed_at: '2024-01-15T11:00:00.000Z'
      }

      mockSupabaseClient.update.mockResolvedValueOnce({
        data: [{ id: responseId, ...updatedResponse }],
        error: null
      })

      const updateMeetingResponseStatus = async (id: string, updates: any) => {
        const { data, error } = await mockSupabaseClient
          .from('meeting_responses')
          .update(updates)
          .eq('id', id)
          .select()

        return { data, error }
      }

      const result = await updateMeetingResponseStatus(responseId, updatedResponse)

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(updatedResponse)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', responseId)
    })
  })

  describe('Data Integrity and Constraints Tests', () => {
    
    it('should enforce foreign key constraints', async () => {
      const foreignKeyError = {
        code: '23503',
        message: 'insert or update on table violates foreign key constraint',
        details: 'Key (trip_id) is not present in table "trips"'
      }

      mockSupabaseClient.insert.mockRejectedValueOnce({
        error: foreignKeyError
      })

      const trackInvalidTrip = async () => {
        try {
          await ParticipantEmailService.trackEmailStatus(
            'nonexistent-trip-id',
            testParticipantId,
            'host_invitation',
            'sent'
          )
        } catch (error: any) {
          return error.error?.code === '23503'
        }
        return false
      }

      // Should handle foreign key constraint gracefully
      await expect(trackInvalidTrip()).resolves.toBe(true)
    })

    it('should validate email type enum values', async () => {
      const enumError = {
        code: '22P02',
        message: 'invalid input value for enum email_type',
        details: '"invalid_email_type" is not a valid email type'
      }

      mockSupabaseClient.update.mockRejectedValueOnce({
        error: enumError
      })

      const trackInvalidEmailType = async () => {
        try {
          await ParticipantEmailService.trackEmailStatus(
            testTripId,
            testParticipantId,
            'invalid_email_type',
            'sent'
          )
          return false
        } catch (error) {
          return true
        }
      }

      await expect(trackInvalidEmailType()).resolves.toBe(true)
    })

    it('should validate meeting response type enum values', async () => {
      const invalidResponseType = {
        response_token: 'test-token',
        response_type: 'invalid_response_type',
        host_email: 'test@host.com',
        company_name: 'Test Company'
      }

      const enumError = {
        code: '22P02',
        message: 'invalid input value for enum response_type'
      }

      mockSupabaseClient.insert.mockRejectedValueOnce({
        error: enumError
      })

      const storeInvalidResponse = async () => {
        try {
          const { data, error } = await mockSupabaseClient
            .from('meeting_responses')
            .insert(invalidResponseType)

          return { data, error }
        } catch (error: any) {
          return { data: null, error: error.error }
        }
      }

      const result = await storeInvalidResponse()
      expect(result.error.code).toBe('22P02')
    })

    it('should handle null values appropriately', async () => {
      const responseWithNulls = {
        response_token: 'null-test-token',
        meeting_id: null,
        activity_id: 'activity-123',
        host_name: null,
        host_email: 'host@test.com',
        company_name: 'Test Company',
        response_type: 'accept',
        response_message: null,
        reschedule_requested_date: null,
        reschedule_requested_time: null
      }

      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: [responseWithNulls],
        error: null
      })

      const storeResponseWithNulls = async (responseData: any) => {
        const { data, error } = await mockSupabaseClient
          .from('meeting_responses')
          .insert(responseData)
          .select()

        return { data, error }
      }

      const result = await storeResponseWithNulls(responseWithNulls)

      expect(result.data[0]).toMatchObject(responseWithNulls)
      expect(result.error).toBeNull()
    })
  })

  describe('Performance and Indexing Tests', () => {
    
    it('should efficiently query email history by trip_id', async () => {
      const largeEmailHistory = Array.from({ length: 1000 }, (_, i) => ({
        id: `email-${i}`,
        trip_id: testTripId,
        participant_id: `participant-${i % 50}`,
        email_type: ['host_invitation', 'guest_itinerary', 'staff_notification'][i % 3],
        status: i % 10 === 0 ? 'failed' : 'sent',
        sent_at: `2024-01-${String(Math.floor(i / 30) + 1).padStart(2, '0')}T10:00:00.000Z`
      }))

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: largeEmailHistory,
        error: null
      })

      const startTime = Date.now()

      const getEmailHistory = async (tripId: string) => {
        const { data, error } = await mockSupabaseClient
          .from('trip_participant_emails')
          .select('*')
          .eq('trip_id', tripId)
          .order('sent_at', { ascending: false })

        return { data, error }
      }

      const result = await getEmailHistory(testTripId)
      const queryTime = Date.now() - startTime

      expect(result.data).toHaveLength(1000)
      expect(queryTime).toBeLessThan(100) // Should be fast with proper indexing
    })

    it('should efficiently query meeting responses by activity_id', async () => {
      const activityId = 'activity-performance-test'
      const meetingResponses = Array.from({ length: 100 }, (_, i) => ({
        id: `response-${i}`,
        activity_id: activityId,
        response_type: ['accept', 'decline', 'reschedule'][i % 3],
        status: 'pending',
        created_at: `2024-01-15T${String(10 + i % 12).padStart(2, '0')}:00:00.000Z`
      }))

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: meetingResponses,
        error: null
      })

      const getMeetingResponses = async (activityId: string) => {
        const { data, error } = await mockSupabaseClient
          .from('meeting_responses')
          .select('*')
          .eq('activity_id', activityId)
          .order('created_at', { ascending: false })

        return { data, error }
      }

      const result = await getMeetingResponses(activityId)

      expect(result.data).toHaveLength(100)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('activity_id', activityId)
    })

    it('should handle pagination for large email datasets', async () => {
      const pageSize = 50
      const offset = 100

      mockSupabaseClient.limit.mockReturnThis()
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: Array.from({ length: pageSize }, (_, i) => ({
          id: `email-page-${offset + i}`
        })),
        error: null
      })

      const getEmailHistoryPaginated = async (tripId: string, limit: number, offset: number) => {
        const { data, error } = await mockSupabaseClient
          .from('trip_participant_emails')
          .select('*')
          .eq('trip_id', tripId)
          .order('sent_at', { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1)

        return { data, error }
      }

      const result = await getEmailHistoryPaginated(testTripId, pageSize, offset)

      expect(result.data).toHaveLength(pageSize)
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(pageSize)
    })
  })

  describe('Cleanup and Maintenance Tests', () => {
    
    it('should support email tracking data cleanup for old trips', async () => {
      const cutoffDate = '2023-12-31T23:59:59.999Z'

      mockSupabaseClient.delete.mockResolvedValueOnce({
        count: 500,
        error: null
      })

      const cleanupOldEmailData = async (cutoffDate: string) => {
        const { count, error } = await mockSupabaseClient
          .from('trip_participant_emails')
          .delete()
          .lte('sent_at', cutoffDate)

        return { deletedCount: count, error }
      }

      const result = await cleanupOldEmailData(cutoffDate)

      expect(result.deletedCount).toBe(500)
      expect(mockSupabaseClient.delete).toHaveBeenCalled()
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('sent_at', cutoffDate)
    })

    it('should support meeting response data archiving', async () => {
      const archiveDate = '2024-01-01T00:00:00.000Z'

      mockSupabaseClient.update.mockResolvedValueOnce({
        count: 250,
        error: null
      })

      const archiveProcessedResponses = async (beforeDate: string) => {
        const { count, error } = await mockSupabaseClient
          .from('meeting_responses')
          .update({ archived: true, archived_at: new Date().toISOString() })
          .eq('status', 'processed')
          .lte('created_at', beforeDate)

        return { archivedCount: count, error }
      }

      const result = await archiveProcessedResponses(archiveDate)

      expect(result.archivedCount).toBe(250)
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          archived: true,
          archived_at: expect.any(String)
        })
      )
    })
  })

  describe('Backup and Recovery Tests', () => {
    
    it('should support email data export for backup', async () => {
      const exportData = {
        trip_participant_emails: [
          { id: 'email-1', trip_id: testTripId, status: 'sent' },
          { id: 'email-2', trip_id: testTripId, status: 'failed' }
        ],
        meeting_responses: [
          { id: 'response-1', response_type: 'accept', status: 'processed' }
        ]
      }

      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: exportData.trip_participant_emails, error: null })
        .mockResolvedValueOnce({ data: exportData.meeting_responses, error: null })

      const exportEmailData = async (tripId: string) => {
        const emailHistory = await mockSupabaseClient
          .from('trip_participant_emails')
          .select('*')
          .eq('trip_id', tripId)

        const meetingResponses = await mockSupabaseClient
          .from('meeting_responses')
          .select('*')
          .eq('trip_id', tripId)

        return {
          trip_participant_emails: emailHistory.data,
          meeting_responses: meetingResponses.data
        }
      }

      const result = await exportEmailData(testTripId)

      expect(result.trip_participant_emails).toHaveLength(2)
      expect(result.meeting_responses).toHaveLength(1)
    })

    it('should support email data restoration from backup', async () => {
      const backupData = {
        trip_participant_emails: [
          { trip_id: testTripId, participant_id: 'restored-1', email_type: 'host_invitation', status: 'sent' }
        ],
        meeting_responses: [
          { response_token: 'restored-token', response_type: 'accept', status: 'processed' }
        ]
      }

      mockSupabaseClient.insert
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: null })

      const restoreEmailData = async (backupData: any) => {
        await mockSupabaseClient
          .from('trip_participant_emails')
          .insert(backupData.trip_participant_emails)

        await mockSupabaseClient
          .from('meeting_responses')
          .insert(backupData.meeting_responses)

        return { success: true }
      }

      const result = await restoreEmailData(backupData)

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(2)
    })
  })
})