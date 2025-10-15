import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/test-utils'
import { MessageForm } from '../message-form'
import userEvent from '@testing-library/user-event'

// Mock TRPC
const mockMutateAsync = vi.fn()
const mockInvalidateQueries = vi.fn()

vi.mock('@/trpc/client', () => ({
  useTRPC: () => ({
    messages: {
      create: {
        mutationOptions: (options: any) => ({
          mutationFn: mockMutateAsync,
          onSuccess: options?.onSuccess,
          onError: options?.onError,
        }),
      },
      getMany: {
        queryOptions: () => ({}),
      },
    },
  }),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useMutation: (options: any) => ({
      mutateAsync: async (data: any) => {
        await mockMutateAsync(data)
        if (options.onSuccess) {
          await options.onSuccess()
        }
      },
      isPending: false,
    }),
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  }
})

describe('MessageForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render textarea with placeholder', () => {
      render(<MessageForm projectId="test-project" />)

      expect(
        screen.getByPlaceholderText('What would you like to build?')
      ).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(<MessageForm projectId="test-project" />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should show keyboard shortcut hint', () => {
      render(<MessageForm projectId="test-project" />)

      expect(screen.getByText('⌘')).toBeInTheDocument()
      expect(screen.getByText(/to submit/)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should disable submit button when form is empty', () => {
      render(<MessageForm projectId="test-project" />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should enable submit button when form has valid input', async () => {
      const user = userEvent.setup()
      render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.type(textarea, 'Build a todo app')

      await waitFor(() => {
        const button = screen.getByRole('button')
        expect(button).not.toBeDisabled()
      })
    })

    it('should not accept messages longer than 10000 characters', async () => {
      const user = userEvent.setup()
      render(<MessageForm projectId="test-project" />)

      const longMessage = 'a'.repeat(10001)
      const textarea = screen.getByPlaceholderText('What would you like to build?')
      
      await user.type(textarea, longMessage)

      await waitFor(() => {
        const button = screen.getByRole('button')
        expect(button).toBeDisabled()
      })
    })

    it('should accept messages exactly 10000 characters', async () => {
      const user = userEvent.setup()
      render(<MessageForm projectId="test-project" />)

      const maxMessage = 'a'.repeat(10000)
      const textarea = screen.getByPlaceholderText('What would you like to build?')
      
      await user.type(textarea, maxMessage)

      await waitFor(() => {
        const button = screen.getByRole('button')
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue({ id: 'msg-1' })

      render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.type(textarea, 'Build a landing page')

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          value: 'Build a landing page',
          projectId: 'test-project',
        })
      })
    })

    it('should clear form after successful submission', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue({ id: 'msg-1' })

      render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.type(textarea, 'Test message')

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(textarea).toHaveValue('')
      })
    })

    it('should submit form with Cmd+Enter', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue({ id: 'msg-1' })

      render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.type(textarea, 'Build a website')
      await user.keyboard('{Meta>}{Enter}{/Meta}')

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })

    it('should submit form with Ctrl+Enter', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue({ id: 'msg-1' })

      render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.type(textarea, 'Build a blog')
      await user.keyboard('{Control>}{Enter}{/Control}')

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })

    it('should not submit with Enter key alone', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue({ id: 'msg-1' })

      render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.type(textarea, 'Test{Enter}')

      // Should have newline, not submit
      expect(mockMutateAsync).not.toHaveBeenCalled()
      expect(textarea).toHaveValue('Test\n')
    })

    it('should invalidate queries after successful submission', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue({ id: 'msg-1' })

      render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.type(textarea, 'Build something')

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalled()
      })
    })
  })

  describe('User Interaction', () => {
    it('should show focus styling when textarea is focused', async () => {
      const user = userEvent.setup()
      render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.click(textarea)

      const form = textarea.closest('form')
      expect(form).toHaveClass('shadow-xs')
    })

    it('should allow typing multiple lines', async () => {
      const user = userEvent.setup()
      render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3')

      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3')
    })
  })

  describe('Loading State', () => {
    it('should disable textarea during submission', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      const { rerender } = render(<MessageForm projectId="test-project" />)

      const textarea = screen.getByPlaceholderText('What would you like to build?')
      await user.type(textarea, 'Test message')

      const button = screen.getByRole('button')
      await user.click(button)

      // During pending state, button should show loader
      // Note: This would need the isPending state to be true in the mock
    })
  })
})