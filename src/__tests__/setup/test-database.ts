/**
 * Test Database Setup Utilities
 * 
 * Utilities for setting up and managing test database state
 * for email workflow testing scenarios.
 */

import { jest } from '@jest/globals'

export interface MockDatabaseState {
  users: Map<string, any>
  trips: Map<string, any>
  tripParticipants: Map<string, any>
  tripParticipantEmails: Map<string, any>
  meetingResponses: Map<string, any>
  activities: Map<string, any>
  companies: Map<string, any>
}

export class TestDatabase {
  private state: MockDatabaseState

  constructor() {
    this.state = {
      users: new Map(),
      trips: new Map(),
      tripParticipants: new Map(),
      tripParticipantEmails: new Map(),
      meetingResponses: new Map(),
      activities: new Map(),
      companies: new Map()
    }

    this.seedInitialData()
  }

  /**
   * Seed database with initial test data
   */
  private seedInitialData() {
    // Wolthers & Associates company
    const wolthersCompany = {
      id: '840783f4-866d-4bdb-9b5d-5d0facf62db0',
      name: 'Wolthers & Associates',
      type: 'consulting',
      created_at: '2024-01-01T00:00:00.000Z'
    }
    this.state.companies.set(wolthersCompany.id, wolthersCompany)

    // Test client company
    const clientCompany = {
      id: 'client-company-123',
      name: 'Test Client Corp',
      type: 'client',
      created_at: '2024-01-01T00:00:00.000Z'
    }
    this.state.companies.set(clientCompany.id, clientCompany)

    // Default test users
    const testUsers = [
      {
        id: 'creator-user-123',
        full_name: 'Trip Creator',
        email: 'creator@wolthers.com',
        company_id: wolthersCompany.id,
        role: 'senior_consultant',
        is_global_admin: false,
        created_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'staff-user-456',
        full_name: 'Staff Member',
        email: 'staff@wolthers.com',
        company_id: wolthersCompany.id,
        role: 'consultant',
        is_global_admin: false,
        created_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'host-user-789',
        full_name: 'Host Manager',
        email: 'host@client.com',
        company_id: clientCompany.id,
        role: 'manager',
        is_global_admin: false,
        created_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'guest-user-101',
        full_name: 'Guest Representative',
        email: 'guest@client.com',
        company_id: clientCompany.id,
        role: 'representative',
        is_global_admin: false,
        created_at: '2024-01-01T00:00:00.000Z'
      }
    ]

    testUsers.forEach(user => {
      this.state.users.set(user.id, user)
    })

    // Default test trip
    const testTrip = {
      id: 'test-trip-123',
      title: 'Test Business Trip',
      access_code: 'TEST_TRIP_001',
      start_date: '2024-02-15',
      end_date: '2024-02-17',
      creator_id: 'creator-user-123',
      status: 'planning',
      step_data: {
        accommodation: {
          name: 'Test Hotel',
          address: '123 Test St, Test City',
          phone: '+55 11 1234-5678'
        },
        transportation: {
          type: 'private_transfer',
          details: 'Airport transfer service'
        }
      },
      created_at: '2024-01-10T00:00:00.000Z'
    }
    this.state.trips.set(testTrip.id, testTrip)

    // Default test activity
    const testActivity = {
      id: 'test-activity-123',
      title: 'Strategy Meeting',
      start_time: '2024-02-15T14:00:00Z',
      duration_minutes: 90,
      location: 'Conference Room A',
      description: 'Strategic planning discussion',
      type: 'meeting',
      company_id: clientCompany.id,
      created_at: '2024-01-10T00:00:00.000Z'
    }
    this.state.activities.set(testActivity.id, testActivity)
  }

  /**
   * Create a mock Supabase client that uses this test database
   */
  createMockSupabaseClient() {
    const mockClient = {
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
    }

    // Configure the mock to use this test database
    this.configureMockClient(mockClient)

    return mockClient
  }

  private configureMockClient(mockClient: any) {
    let currentTable = ''
    let currentQuery: any = {}

    // Track which table is being queried
    mockClient.from.mockImplementation((table: string) => {
      currentTable = table
      currentQuery = { table, operations: [] }
      return mockClient
    })

    // Track query operations
    const operations = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'gte', 'lte', 'order', 'limit']
    operations.forEach(op => {
      mockClient[op].mockImplementation((arg1?: any, arg2?: any) => {
        currentQuery.operations.push({ type: op, args: [arg1, arg2] })
        return mockClient
      })
    })

    // Handle single() - executes the query
    mockClient.single.mockImplementation(() => {
      return this.executeQuery(currentQuery, true)
    })

    // Handle queries without single() - executes immediately
    mockClient.select.mockImplementation((columns?: string) => {
      currentQuery.operations.push({ type: 'select', args: [columns] })
      
      // If this is the end of the chain, execute immediately
      return {
        ...mockClient,
        then: (callback: Function) => {
          const result = this.executeQuery(currentQuery, false)
          return callback(result)
        }
      }
    })
  }

  private executeQuery(query: any, single: boolean): Promise<any> {
    const { table, operations } = query

    try {
      let data: any
      const tableData = this.state[table as keyof MockDatabaseState]

      if (!tableData) {
        return Promise.resolve({ data: null, error: { message: `Table ${table} not found` } })
      }

      // Handle different operation types
      const selectOp = operations.find((op: any) => op.type === 'select')
      const eqOps = operations.filter((op: any) => op.type === 'eq')
      const insertOp = operations.find((op: any) => op.type === 'insert')
      const updateOp = operations.find((op: any) => op.type === 'update')
      const deleteOp = operations.find((op: any) => op.type === 'delete')

      if (insertOp) {
        // Handle insert
        const insertData = insertOp.args[0]
        const id = insertData.id || `generated-${Date.now()}`
        const record = { ...insertData, id }
        
        if (Array.isArray(insertData)) {
          insertData.forEach((item: any, index: number) => {
            const itemId = item.id || `generated-${Date.now()}-${index}`
            ;(tableData as Map<string, any>).set(itemId, { ...item, id: itemId })
          })
          data = insertData
        } else {
          ;(tableData as Map<string, any>).set(id, record)
          data = single ? record : [record]
        }
      } else if (updateOp) {
        // Handle update
        const updateData = updateOp.args[0]
        const targetIds = this.findMatchingIds(tableData as Map<string, any>, eqOps)
        
        targetIds.forEach(id => {
          const existing = (tableData as Map<string, any>).get(id)
          if (existing) {
            ;(tableData as Map<string, any>).set(id, { ...existing, ...updateData })
          }
        })

        data = single && targetIds.length > 0 
          ? (tableData as Map<string, any>).get(targetIds[0])
          : targetIds.map(id => (tableData as Map<string, any>).get(id))
      } else if (deleteOp) {
        // Handle delete
        const targetIds = this.findMatchingIds(tableData as Map<string, any>, eqOps)
        targetIds.forEach(id => {
          ;(tableData as Map<string, any>).delete(id)
        })
        data = { count: targetIds.length }
      } else {
        // Handle select
        let records = Array.from((tableData as Map<string, any>).values())
        
        // Apply filters
        eqOps.forEach((eqOp: any) => {
          const [field, value] = eqOp.args
          records = records.filter(record => record[field] === value)
        })

        // Apply ordering
        const orderOp = operations.find((op: any) => op.type === 'order')
        if (orderOp) {
          const [field, options] = orderOp.args
          const ascending = !options || options.ascending !== false
          records.sort((a, b) => {
            const aVal = a[field]
            const bVal = b[field]
            const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
            return ascending ? result : -result
          })
        }

        // Apply limit
        const limitOp = operations.find((op: any) => op.type === 'limit')
        if (limitOp) {
          records = records.slice(0, limitOp.args[0])
        }

        data = single ? records[0] || null : records
      }

      return Promise.resolve({ data, error: null })
    } catch (error) {
      return Promise.resolve({ data: null, error })
    }
  }

  private findMatchingIds(tableData: Map<string, any>, eqOps: any[]): string[] {
    const records = Array.from(tableData.entries())
    
    return records
      .filter(([id, record]) => {
        return eqOps.every(eqOp => {
          const [field, value] = eqOp.args
          return record[field] === value
        })
      })
      .map(([id]) => id)
  }

  /**
   * Add a user to the test database
   */
  addUser(user: any) {
    this.state.users.set(user.id, user)
  }

  /**
   * Add a trip to the test database
   */
  addTrip(trip: any) {
    this.state.trips.set(trip.id, trip)
  }

  /**
   * Add a participant to the test database
   */
  addTripParticipant(participant: any) {
    const id = participant.id || `participant-${Date.now()}`
    this.state.tripParticipants.set(id, { ...participant, id })
  }

  /**
   * Add email tracking record
   */
  addEmailTracking(emailRecord: any) {
    const id = emailRecord.id || `email-${Date.now()}`
    this.state.tripParticipantEmails.set(id, { ...emailRecord, id })
  }

  /**
   * Add meeting response
   */
  addMeetingResponse(response: any) {
    const id = response.id || `response-${Date.now()}`
    this.state.meetingResponses.set(id, { ...response, id })
  }

  /**
   * Get all records from a table
   */
  getTableData(table: keyof MockDatabaseState) {
    return Array.from(this.state[table].values())
  }

  /**
   * Clear all data from a table
   */
  clearTable(table: keyof MockDatabaseState) {
    this.state[table].clear()
  }

  /**
   * Reset database to initial state
   */
  reset() {
    Object.values(this.state).forEach(table => table.clear())
    this.seedInitialData()
  }

  /**
   * Get database statistics for testing
   */
  getStats() {
    return {
      users: this.state.users.size,
      trips: this.state.trips.size,
      tripParticipants: this.state.tripParticipants.size,
      tripParticipantEmails: this.state.tripParticipantEmails.size,
      meetingResponses: this.state.meetingResponses.size,
      activities: this.state.activities.size,
      companies: this.state.companies.size
    }
  }
}

// Global test database instance
export const testDatabase = new TestDatabase()

// Helper functions for test setup
export const setupTestDatabase = () => {
  beforeEach(() => {
    testDatabase.reset()
  })
}

export const createTestScenario = (scenario: 'simple_trip' | 'complex_trip' | 'multi_company_trip') => {
  testDatabase.reset()

  switch (scenario) {
    case 'simple_trip':
      // Basic trip with one host and one staff member
      testDatabase.addTripParticipant({
        trip_id: 'test-trip-123',
        user_id: 'host-user-789',
        role: 'host',
        company_id: 'client-company-123'
      })
      testDatabase.addTripParticipant({
        trip_id: 'test-trip-123',
        user_id: 'staff-user-456',
        role: 'staff',
        company_id: '840783f4-866d-4bdb-9b5d-5d0facf62db0'
      })
      break

    case 'complex_trip':
      // Trip with multiple participants and roles
      const complexParticipants = [
        { user_id: 'host-user-789', role: 'host', company_id: 'client-company-123' },
        { user_id: 'guest-user-101', role: 'client_representative', company_id: 'client-company-123' },
        { user_id: 'staff-user-456', role: 'staff', company_id: '840783f4-866d-4bdb-9b5d-5d0facf62db0' },
        { user_id: 'creator-user-123', role: 'staff', company_id: '840783f4-866d-4bdb-9b5d-5d0facf62db0' }
      ]
      
      complexParticipants.forEach(participant => {
        testDatabase.addTripParticipant({
          trip_id: 'test-trip-123',
          ...participant
        })
      })
      break

    case 'multi_company_trip':
      // Trip involving multiple client companies
      const partner2Company = {
        id: 'partner-company-456',
        name: 'Partner Company Ltd',
        type: 'partner'
      }
      testDatabase.state.companies.set(partner2Company.id, partner2Company)

      const multiCompanyParticipants = [
        { user_id: 'host-user-789', role: 'host', company_id: 'client-company-123' },
        { user_id: 'guest-user-101', role: 'external_guest', company_id: 'partner-company-456' },
        { user_id: 'staff-user-456', role: 'staff', company_id: '840783f4-866d-4bdb-9b5d-5d0facf62db0' }
      ]

      multiCompanyParticipants.forEach(participant => {
        testDatabase.addTripParticipant({
          trip_id: 'test-trip-123',
          ...participant
        })
      })
      break
  }
}