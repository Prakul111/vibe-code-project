# Test Documentation

This document provides an overview of the comprehensive test suite for the Vibe Code Project.

## Test Framework

- **Testing Framework**: [Vitest](https://vitest.dev/) - A blazing fast unit test framework powered by Vite
- **React Testing**: [@testing-library/react](https://testing-library.com/react) - Simple and complete React testing utilities
- **User Interactions**: [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) - Advanced simulation of browser interactions

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### 1. Utility Functions Tests (`src/__tests__/lib/`)

#### `utils.test.ts`
Tests for the className merging utility function (`cn`).

**Coverage:**
- Basic class merging
- Conditional class application
- Tailwind CSS conflict resolution
- Edge cases (undefined, null, empty strings)
- Array and object inputs
- Complex Tailwind variants

### 2. Inngest Utilities Tests (`src/__tests__/inngest/`)

#### `utils.test.ts`
Tests for Inngest utility functions.

**Coverage:**
- `getSandbox()`: Sandbox connection handling
- `lastAssistantTextMessageContent()`: Message content extraction
- Error handling
- Edge cases with different message formats

### 3. Server-Side Procedures Tests

#### `src/modules/messages/server/__tests__/procedures.test.ts`
Tests for message-related TRPC procedures.

**Coverage:**
- `getMany`: Retrieving messages for a project
  - Valid requests
  - Empty results
  - Validation errors
  - Ordering by updateAt
- `create`: Creating new messages
  - Valid message creation
  - Validation (required fields, length limits)
  - Inngest event triggering
  - Database error handling
  - Edge cases (max length messages)

#### `src/modules/projects/server/__tests__/procedures.test.ts`
Tests for project-related TRPC procedures.

**Coverage:**
- `getOne`: Retrieving a single project
  - Valid requests
  - NOT_FOUND errors
  - Validation errors
  - Database errors
- `getMany`: Retrieving all projects
  - Ordered results
  - Empty results
  - Error handling
- `create`: Creating new projects
  - Valid project creation with slug generation
  - Nested message creation
  - Validation (required fields, length limits)
  - Inngest event triggering
  - Edge cases

### 4. React Component Tests

#### `src/modules/projects/ui/components/__tests__/message-card.test.tsx`
Tests for the MessageCard component.

**Coverage:**
- User messages rendering
- Assistant messages rendering
- Fragment display and interaction
- Error state styling
- Active/inactive fragment highlighting
- Click handlers
- Edge cases (empty content, special characters)
- Timestamp formatting

#### `src/modules/projects/ui/components/__tests__/message-form.test.tsx`
Tests for the MessageForm component.

**Coverage:**
- Form rendering
- Input validation
  - Empty input
  - Maximum length (10,000 characters)
  - Edge cases
- Form submission
  - Valid submissions
  - Keyboard shortcuts (Cmd+Enter, Ctrl+Enter)
  - Form reset after submission
  - Query invalidation
- User interactions
  - Focus states
  - Multi-line input
- Loading states

#### `src/modules/projects/ui/components/__tests__/message-loading.test.tsx`
Tests for the MessageLoading component.

**Coverage:**
- Logo and branding display
- Loading message cycling
- Animation states
- Message sequence
- Timer cleanup

#### `src/modules/projects/ui/components/__tests__/fragment-web.test.tsx`
Tests for the FragmentWeb component.

**Coverage:**
- Iframe rendering with sandbox attributes
- URL display and copying
- Refresh functionality
- Open in new tab
- Disabled states
- Clipboard integration
- Edge cases (empty URLs, no files)

#### `src/modules/projects/ui/components/__tests__/messages-container.test.tsx`
Tests for the MessagesContainer component.

**Coverage:**
- Message list rendering
- Form integration
- Loading indicator logic
- Fragment interaction
- Active fragment highlighting
- Scroll behavior
- Empty state handling
- Auto-refresh functionality

#### `src/modules/projects/ui/components/__tests__/project-header.test.tsx`
Tests for the ProjectHeader component.

**Coverage:**
- Project name display
- Logo rendering
- Dropdown menu functionality
- Theme switching
- Navigation links
- Edge cases (long names, special characters)
- Styling

### 5. TRPC Router Tests (`src/__tests__/trpc/`)

#### `router.test.ts`
Tests for TRPC router integration.

**Coverage:**
- Router structure validation
- Procedure existence
- Type exports

## Test Patterns and Best Practices

### 1. Mocking Strategy

**External Dependencies:**
- `@/lib/db` (Prisma): Mocked to avoid database calls
- `@/inngest/client`: Mocked to avoid external service calls
- `@e2b/code-interpreter`: Mocked sandbox connections
- Next.js components (Image, Link): Mocked for rendering

**React Query:**
- Custom test utilities wrapper with QueryClientProvider
- Disabled retries for faster test execution

### 2. Test Organization

Each test file follows this structure:
1. **Imports and Mocks**: All necessary imports and mock setups
2. **Test Suite**: Organized by functionality
3. **Setup/Teardown**: Using `beforeEach` and `afterEach`
4. **Descriptive Test Names**: Clear, action-oriented names

### 3. Coverage Areas

- ✅ Happy paths
- ✅ Error scenarios
- ✅ Edge cases
- ✅ Validation
- ✅ User interactions
- ✅ State management
- ✅ Async operations

## Configuration Files

### `vitest.config.ts`
Main Vitest configuration with:
- jsdom environment for React testing
- Path aliases matching tsconfig
- Coverage configuration
- Global test utilities

### `vitest.setup.ts`
Test setup file with:
- jest-dom matchers
- Automatic cleanup
- Next.js component mocks
- Theme provider mocks

### `src/__tests__/test-utils.tsx`
Custom render utilities with:
- QueryClientProvider wrapper
- Custom render function
- Re-exports of testing library utilities

## Coverage Goals

Target coverage metrics:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Excluded from coverage:
- Generated files (`src/generated/`)
- Type definitions (`**/*.d.ts`)
- Configuration files
- Build outputs

## Continuous Testing

### Watch Mode
Use watch mode during development:
```bash
npm test -- --watch
```

### UI Mode
Use UI mode for visual test exploration:
```bash
npm run test:ui
```

### Coverage Reports
Generate and view coverage reports:
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Future Improvements

1. **Integration Tests**: Add tests for full user flows
2. **E2E Tests**: Consider Playwright for end-to-end testing
3. **Performance Tests**: Add performance benchmarks
4. **Accessibility Tests**: Enhance a11y testing with jest-axe
5. **Snapshot Tests**: Add visual regression testing
6. **API Mocking**: Consider MSW for more realistic API mocking

## Troubleshooting

### Common Issues

**Mock not working:**
- Ensure mocks are defined before imports
- Check mock path matches actual import path
- Use `vi.hoisted()` for complex mock scenarios

**Async tests timing out:**
- Use `waitFor` for async operations
- Increase timeout with `{ timeout: 10000 }`
- Check for unresolved promises

**Component not rendering:**
- Verify all required props are provided
- Check that mocks are properly set up
- Ensure context providers are wrapped

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing TRPC](https://trpc.io/docs/server/testing)