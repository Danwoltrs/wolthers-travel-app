/**
 * Jest Setup Configuration
 * 
 * Global test setup and configuration for email workflow testing.
 * Handles environment variables, global mocks, and test utilities.
 */

import { jest } from '@jest/globals'

// Extend Jest matchers
import '@testing-library/jest-dom'

// Global test environment setup
beforeAll(() => {
  // Set up environment variables for testing
  process.env.NODE_ENV = 'test'
  process.env.RESEND_API_KEY = 'test-resend-api-key'
  process.env.MEETING_TOKEN_SECRET = 'test-meeting-token-secret-key'
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.SUPABASE_URL = 'http://localhost:54321'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  process.env.SUPABASE_ANON_KEY = 'test-anon-key'

  // Mock console methods to reduce noise in test output
  const originalConsole = global.console
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }

  // Store original console for tests that need to verify console output
  ;(global as any).originalConsole = originalConsole
})

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()
  
  // Reset Date mock to real implementation
  jest.restoreAllMocks()
  
  // Set up consistent date for testing
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
})

afterEach(() => {
  // Restore timers after each test
  jest.useRealTimers()
  
  // Clear all mocks
  jest.clearAllMocks()
  
  // Reset modules to ensure clean state
  jest.resetModules()
})

afterAll(() => {
  // Restore original console
  global.console = (global as any).originalConsole
})

// Global test utilities
global.TestUtils = {
  /**
   * Create a mock Supabase client with common methods
   */
  createMockSupabaseClient: () => ({
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
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }),

  /**
   * Create mock email data for testing
   */
  createMockEmailData: {
    hostInvitation: {
      hostName: 'Test Host',
      hostEmail: 'host@test.com',
      companyName: 'Test Company',
      tripTitle: 'Test Trip',
      tripAccessCode: 'TEST_001',
      tripStartDate: '2024-01-15',
      tripEndDate: '2024-01-17',
      inviterName: 'Test Organizer',
      inviterEmail: 'organizer@wolthers.com',
      wolthersTeam: [],
      confirmationUrl: 'http://localhost:3000/host/confirm/test',
      platformLoginUrl: 'http://localhost:3000/host/login',
      visitingCompanyName: 'Wolthers & Associates',
      visitDate: 'Monday, January 15, 2024',
      visitTime: '9:00 AM'
    },

    guestItinerary: {
      guestName: 'Test Guest',
      guestEmail: 'guest@test.com',
      tripTitle: 'Test Trip',
      tripAccessCode: 'TEST_001',
      tripStartDate: '2024-01-15',
      tripEndDate: '2024-01-17',
      createdBy: 'Test Organizer',
      itinerary: [],
      emergencyContacts: [
        {
          name: 'Emergency Support',
          role: 'Support Team',
          email: 'support@wolthers.com'
        }
      ]
    },

    staffInvitation: {
      inviterName: 'Test Manager',
      inviterEmail: 'manager@wolthers.com',
      newStaffName: 'Test Staff',
      role: 'Test Role'
    },

    meetingRequest: {
      hostName: 'Test Host',
      hostEmail: 'host@test.com',
      companyName: 'Test Company',
      meetingTitle: 'Test Meeting',
      meetingDate: '2024-01-15T14:00:00Z',
      meetingTime: '2:00 PM',
      wolthersTeam: [],
      tripTitle: 'Test Trip',
      tripAccessCode: 'TEST_001',
      inviterName: 'Test Organizer',
      inviterEmail: 'organizer@wolthers.com',
      acceptUrl: 'http://localhost:3000/meeting/response/accept?token=test',
      declineUrl: 'http://localhost:3000/meeting/response/decline?token=test',
      rescheduleUrl: 'http://localhost:3000/meeting/response/reschedule?token=test'
    }
  },

  /**
   * Create mock participant email context
   */
  createMockEmailContext: (overrides = {}) => ({
    tripId: 'test-trip-123',
    tripTitle: 'Test Trip',
    tripAccessCode: 'TEST_001',
    tripStartDate: '2024-01-15',
    tripEndDate: '2024-01-17',
    createdBy: 'Test Creator',
    createdByEmail: 'creator@wolthers.com',
    participants: [],
    ...overrides
  }),

  /**
   * Create mock user data
   */
  createMockUser: (overrides = {}) => ({
    id: 'test-user-123',
    full_name: 'Test User',
    email: 'test@wolthers.com',
    is_global_admin: false,
    company_id: '840783f4-866d-4bdb-9b5d-5d0facf62db0',
    ...overrides
  }),

  /**
   * Create mock trip data
   */
  createMockTrip: (overrides = {}) => ({
    id: 'test-trip-123',
    title: 'Test Trip',
    access_code: 'TEST_001',
    start_date: '2024-01-15',
    end_date: '2024-01-17',
    creator_id: 'test-user-123',
    status: 'planning',
    trip_access_permissions: [],
    users: {
      full_name: 'Test Creator',
      email: 'creator@wolthers.com'
    },
    ...overrides
  }),

  /**
   * Create mock participant data
   */
  createMockParticipant: (overrides = {}) => ({
    id: 'test-participant-123',
    full_name: 'Test Participant',
    email: 'participant@test.com',
    company_id: 'test-company-123',
    companies: {
      name: 'Test Company'
    },
    ...overrides
  }),

  /**
   * Mock successful email sending result
   */
  createSuccessfulEmailResult: (emailType = 'test_email') => ({
    success: true,
    id: 'test-email-123',
    messageId: 'test-message-123',
    emailType
  }),

  /**
   * Mock failed email sending result
   */
  createFailedEmailResult: (error = 'Test error', emailType = 'test_email') => ({
    success: false,
    error,
    emailType
  }),

  /**
   * Wait for async operations to complete
   */
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Advance timers by specified milliseconds
   */
  advanceTimers: (ms = 1000) => {
    jest.advanceTimersByTime(ms)
  }
}

// Type declarations for global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      TestUtils: typeof global.TestUtils
      originalConsole: Console
    }
  }

  var TestUtils: {
    createMockSupabaseClient: () => any
    createMockEmailData: {
      hostInvitation: any
      guestItinerary: any
      staffInvitation: any
      meetingRequest: any
    }
    createMockEmailContext: (overrides?: any) => any
    createMockUser: (overrides?: any) => any
    createMockTrip: (overrides?: any) => any
    createMockParticipant: (overrides?: any) => any
    createSuccessfulEmailResult: (emailType?: string) => any
    createFailedEmailResult: (error?: string, emailType?: string) => any
    waitFor: (ms?: number) => Promise<void>
    advanceTimers: (ms?: number) => void
  }

  var originalConsole: Console
}

// Custom Jest matchers for email workflow testing
expect.extend({
  toHaveBeenCalledWithEmailData(received: jest.MockedFunction<any>, expectedEmailType: string) {
    const calls = received.mock.calls
    const pass = calls.some(call => 
      call.length >= 2 && 
      typeof call[1] === 'object' &&
      (call[1].hostEmail || call[1].guestEmail || call[1].newStaffName)
    )

    if (pass) {
      return {
        message: () => `Expected ${received.getMockName()} not to have been called with email data`,
        pass: true,
      }
    } else {
      return {
        message: () => `Expected ${received.getMockName()} to have been called with email data`,
        pass: false,
      }
    }
  },

  toHaveBeenCalledWithValidToken(received: jest.MockedFunction<any>) {
    const calls = received.mock.calls
    const pass = calls.some(call => {
      if (call.length === 0) return false
      const token = call[0]
      return typeof token === 'string' && token.includes('.')
    })

    if (pass) {
      return {
        message: () => `Expected ${received.getMockName()} not to have been called with valid token`,
        pass: true,
      }
    } else {
      return {
        message: () => `Expected ${received.getMockName()} to have been called with valid token`,
        pass: false,
      }
    }
  }
})

// Extend Jest matcher types
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithEmailData(expectedEmailType: string): R
      toHaveBeenCalledWithValidToken(): R
    }
  }
}