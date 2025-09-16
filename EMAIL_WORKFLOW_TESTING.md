# Email Workflow Testing Guide

This guide provides comprehensive instructions for testing the complete email workflow system in the Wolthers Travel App. The test suite covers all aspects of email sending, from participant addition to delivery tracking and response handling.

## Table of Contents

1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [Setup and Installation](#setup-and-installation)
4. [Running Tests](#running-tests)
5. [Test Suites](#test-suites)
6. [Test Coverage](#test-coverage)
7. [Testing Scenarios](#testing-scenarios)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)

## Overview

The email workflow testing system validates:

- **Participant Email Service**: Role-based email sending logic
- **API Integration**: REST endpoints that trigger email workflows
- **Resend API Integration**: External email service communication
- **Meeting Response System**: Token-based response handling
- **Database Tracking**: Email status and history management
- **End-to-End Workflows**: Complete participant-to-email-to-response cycles

### Key Features Tested

- ✅ **Host Meeting Requests**: Meeting invitations with response URLs
- ✅ **Guest Itineraries**: Comprehensive trip information emails  
- ✅ **Staff Notifications**: Team member assignment alerts
- ✅ **Database Tracking**: Email delivery status and history
- ✅ **Error Handling**: Graceful failure recovery
- ✅ **Performance**: Batch processing and concurrent operations
- ✅ **Security**: Token validation and data integrity

## Test Architecture

```
src/__tests__/
├── setup/
│   ├── jest.setup.ts          # Global test configuration
│   └── test-database.ts       # Mock database utilities
├── email-workflow.test.ts     # Unit tests for email service
├── api-email-integration.test.ts    # API endpoint integration
├── resend-api-integration.test.ts   # External service integration
├── meeting-response-system.test.ts  # Response handling tests
├── database-email-tracking.test.ts  # Database operations
└── e2e-email-workflow.test.ts       # End-to-end scenarios
```

### Test Categories

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Multi-component interaction testing
3. **End-to-End Tests** - Complete workflow validation

## Setup and Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- TypeScript 5+
- Jest 29+

### Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Install Test Dependencies** (if not already installed):
   ```bash
   npm install --save-dev jest @jest/globals ts-jest @testing-library/jest-dom @types/jest babel-jest
   ```

3. **Environment Setup**:
   Create a `.env.test` file with test environment variables:
   ```bash
   NODE_ENV=test
   RESEND_API_KEY=test-resend-api-key
   MEETING_TOKEN_SECRET=test-meeting-token-secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXTAUTH_SECRET=test-nextauth-secret
   JWT_SECRET=test-jwt-secret
   SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
   SUPABASE_ANON_KEY=test-anon-key
   ```

## Running Tests

### Quick Start

```bash
# Run all email workflow tests
npm run test:email-workflow

# Run tests in watch mode
npm run test:email-workflow:watch

# Run with coverage report
npm run test:email-workflow:coverage
```

### Specific Test Categories

```bash
# Unit tests only
npm run test:unit

# Integration tests only  
npm run test:integration

# End-to-end tests only
npm run test:e2e
```

### Individual Test Files

```bash
# Email service unit tests
npm test src/__tests__/email-workflow.test.ts

# API integration tests
npm test src/__tests__/api-email-integration.test.ts

# Resend API tests
npm test src/__tests__/resend-api-integration.test.ts

# Meeting response tests
npm test src/__tests__/meeting-response-system.test.ts

# Database tracking tests
npm test src/__tests__/database-email-tracking.test.ts

# End-to-end workflow tests
npm test src/__tests__/e2e-email-workflow.test.ts
```

### Test Options

```bash
# Verbose output
npm test -- --verbose

# Run specific test pattern
npm test -- --testNamePattern="should send host meeting request"

# Update snapshots
npm test -- --updateSnapshot

# Run tests serially (useful for debugging)
npm test -- --runInBand
```

## Test Suites

### 1. Email Workflow Unit Tests (`email-workflow.test.ts`)

Tests the core `ParticipantEmailService` class functionality:

**Test Categories:**
- Email template generation for all roles
- Role-based routing logic
- Error handling and validation
- Email skipping scenarios
- Database tracking integration

**Key Tests:**
```javascript
describe('Email Workflow System', () => {
  describe('Unit Tests - Email Template Generation', () => {
    it('should generate host meeting request email correctly')
    it('should generate guest itinerary email correctly')  
    it('should generate staff notification email correctly')
    it('should skip email for participant without email address')
  })
})
```

### 2. API Email Integration Tests (`api-email-integration.test.ts`)

Tests REST API endpoints that trigger email workflows:

**Test Categories:**
- POST `/api/trips/[id]/participants` - Single participant addition
- PATCH `/api/trips/[id]/participants` - Bulk participant updates
- Authentication and authorization
- Error handling and database failures

**Key Tests:**
```javascript
describe('API Email Integration Tests', () => {
  it('should trigger email when adding staff participant')
  it('should not fail participant addition if email sending fails')
  it('should handle duplicate participant addition gracefully')
})
```

### 3. Resend API Integration Tests (`resend-api-integration.test.ts`)

Tests integration with the Resend email service:

**Test Categories:**
- Email template compilation and sending
- Rate limiting and error handling
- Email content validation
- Mobile-responsive templates
- Performance and batching

**Key Tests:**
```javascript
describe('Resend API Integration', () => {
  it('should send host invitation email with correct data')
  it('should handle Resend API rate limiting')
  it('should generate valid HTML with proper encoding')
})
```

### 4. Meeting Response System Tests (`meeting-response-system.test.ts`)

Tests the token-based meeting response system:

**Test Categories:**
- Token generation and validation
- URL creation and processing
- Security and expiration validation
- Response handling workflow

**Key Tests:**
```javascript
describe('Meeting Response System', () => {
  it('should generate unique tokens for different response types')
  it('should validate correctly formatted tokens')
  it('should reject expired tokens')
})
```

### 5. Database Email Tracking Tests (`database-email-tracking.test.ts`)

Tests database operations for email tracking:

**Test Categories:**
- Email status recording and updates
- Email history and statistics
- Meeting response storage
- Data integrity and constraints
- Performance and indexing

**Key Tests:**
```javascript
describe('Database Email Tracking', () => {
  it('should record successful email delivery in trip_participants table')
  it('should handle database connection failures gracefully')
  it('should maintain data consistency across email tracking tables')
})
```

### 6. End-to-End Workflow Tests (`e2e-email-workflow.test.ts`)

Tests complete workflows from start to finish:

**Test Categories:**
- Complete host email workflow
- Complete guest email workflow  
- Complete staff email workflow
- Error recovery and resilience
- Performance and scalability
- Data consistency and integrity

**Key Tests:**
```javascript
describe('End-to-End Email Workflow', () => {
  it('should complete full host workflow: participant addition → meeting request email → response handling')
  it('should handle large batch participant additions efficiently')
  it('should maintain data consistency across email tracking tables')
})
```

## Test Coverage

### Coverage Thresholds

The test suite enforces the following minimum coverage requirements:

**Global Thresholds:**
- Branches: 70%
- Functions: 75%
- Lines: 75%
- Statements: 75%

**Email Workflow Components (Higher Thresholds):**
- `ParticipantEmailService`: 90% across all metrics
- `meeting-response-tokens`: 90% across all metrics
- `resend.ts`: 85% across all metrics

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:email-workflow:coverage

# View coverage report
open coverage/lcov-report/index.html
```

**Coverage Report Includes:**
- Line-by-line coverage visualization
- Branch coverage analysis
- Function coverage tracking
- Uncovered code highlighting
- Coverage trends and history

## Testing Scenarios

### Scenario 1: Simple Host Meeting Request

**Objective**: Test basic host email workflow

**Steps**:
1. Add host participant via API
2. Verify meeting request email is sent
3. Validate response URLs are generated
4. Test meeting response processing
5. Confirm database tracking

**Expected Results**:
- Host receives meeting request email
- Response URLs are valid and secure
- Database records email delivery
- Meeting responses are properly stored

### Scenario 2: Complex Multi-Stakeholder Trip

**Objective**: Test comprehensive email workflow with multiple participant types

**Setup**:
- 2 Host participants (different companies)
- 3 Guest participants
- 4 Staff participants

**Expected Results**:
- Host participants receive meeting request emails
- Guest participants receive comprehensive itinerary emails
- Staff participants receive notification emails
- All emails are tracked in database
- No duplicate emails sent

### Scenario 3: Error Recovery Workflow

**Objective**: Test system resilience under failure conditions

**Test Cases**:
- Resend API unavailable
- Database connection lost
- Invalid participant data
- Rate limiting exceeded

**Expected Results**:
- Participant addition continues despite email failures
- Error tracking in database
- Graceful degradation of service
- No data corruption

### Scenario 4: Performance and Load Testing

**Objective**: Test system performance under load

**Load Conditions**:
- 50 participants added simultaneously
- 100 concurrent API requests
- Large batch email sending

**Performance Criteria**:
- API responses < 2 seconds
- Email processing < 5 seconds per batch
- No memory leaks or resource exhaustion
- Proper error handling under load

### Scenario 5: Security and Data Integrity

**Objective**: Validate security measures and data consistency

**Security Tests**:
- Token tampering attempts
- Invalid authentication tokens
- SQL injection attempts (via mocked queries)
- Cross-site request forgery protection

**Data Integrity Tests**:
- Foreign key constraint validation
- Enum value validation
- Transaction-like consistency
- Concurrent modification handling

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

**Problem**: Tests fail with timeout errors

**Solutions**:
```bash
# Increase timeout for specific tests
npm test -- --testTimeout=60000

# Run tests serially to avoid resource conflicts  
npm test -- --runInBand

# Check for hanging promises in test code
```

#### 2. Mock Setup Issues

**Problem**: Mocks not working correctly

**Solutions**:
- Verify mock modules are properly imported
- Check mock implementation matches actual API
- Clear mocks between tests:
  ```javascript
  beforeEach(() => {
    jest.clearAllMocks()
  })
  ```

#### 3. Environment Variable Issues

**Problem**: Tests fail due to missing environment variables

**Solutions**:
- Verify `.env.test` file exists
- Check test setup configuration
- Confirm Jest is loading environment correctly

#### 4. TypeScript Compilation Errors

**Problem**: Tests fail to compile TypeScript

**Solutions**:
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update Jest TypeScript configuration
# Verify ts-jest preset is correctly configured
```

#### 5. Database State Issues

**Problem**: Tests interfere with each other

**Solutions**:
- Use test database utilities for isolation
- Reset mock database state between tests:
  ```javascript
  beforeEach(() => {
    testDatabase.reset()
  })
  ```

### Debugging Tips

#### 1. Enable Verbose Logging

```javascript
// In test files
const originalConsole = global.console
global.console = originalConsole // Restore console for debugging
```

#### 2. Inspect Mock Calls

```javascript
// Check what mocks were called with
console.log(mockFunction.mock.calls)
console.log(mockFunction.mock.results)
```

#### 3. Test Individual Components

```bash
# Test specific describe blocks
npm test -- --testNamePattern="Email Template Generation"

# Test specific files
npm test -- email-workflow.test.ts
```

#### 4. Use Test Database Utilities

```javascript
// Check test database state
console.log(testDatabase.getStats())
console.log(testDatabase.getTableData('trip_participant_emails'))
```

### Performance Issues

#### 1. Slow Test Execution

**Optimization Strategies**:
- Use `jest.useFakeTimers()` for time-dependent tests
- Mock external services instead of making real API calls
- Parallel test execution with `--maxWorkers`
- Optimize mock implementations

#### 2. Memory Usage

**Monitoring and Optimization**:
```bash
# Monitor memory usage during tests
npm test -- --logHeapUsage

# Detect memory leaks
npm test -- --detectLeaks
```

## Contributing

### Adding New Tests

1. **Follow Naming Conventions**:
   - Test files: `*.test.ts`
   - Describe blocks: Use clear, descriptive names
   - Test names: Use "should [expected behavior]" format

2. **Use Test Utilities**:
   ```javascript
   // Use global test utilities
   const mockUser = TestUtils.createMockUser()
   const mockEmailData = TestUtils.createMockEmailData.hostInvitation
   ```

3. **Maintain Coverage**:
   - Ensure new features have corresponding tests
   - Maintain or improve coverage percentages
   - Test both success and failure scenarios

4. **Follow Test Structure**:
   ```javascript
   describe('Feature Name', () => {
     describe('Category Name', () => {
       it('should behave correctly under normal conditions', () => {
         // Arrange
         // Act  
         // Assert
       })
       
       it('should handle error conditions gracefully', () => {
         // Arrange error scenario
         // Act
         // Assert error handling
       })
     })
   })
   ```

### Code Quality Standards

1. **TypeScript**: All test code must be properly typed
2. **ESLint**: Follow project linting rules
3. **Documentation**: Comment complex test logic
4. **DRY Principle**: Reuse test utilities and helpers
5. **Clean Up**: Proper mock cleanup and resource disposal

### Pull Request Guidelines

1. **Test Coverage**: Ensure all new code is tested
2. **Documentation**: Update this guide if needed
3. **Performance**: Consider impact on test execution time
4. **Backwards Compatibility**: Don't break existing tests

---

## Summary

This comprehensive test suite ensures the reliability and robustness of the email workflow system. By following this guide, you can:

- **Validate** all email workflow components work correctly
- **Catch** regressions before they reach production  
- **Maintain** high code quality and coverage
- **Debug** issues efficiently with detailed test feedback
- **Scale** the system confidently with comprehensive validation

For additional support or questions about the email workflow testing system, refer to the codebase documentation or contact the development team.

**Happy Testing! 🧪**