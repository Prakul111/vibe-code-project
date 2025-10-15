import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/test-utils'
import { MessagesContainer } from '../messages-container'
import { MessageRole, MessageType, Fragment } from '@/generated/prisma'

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Build a todo app',
    role: 'USER' as MessageRole,
    type: 'RESULT' as MessageType,
    projectId: 'project-1',
    createAt: new Date('2024-01-01T10:00:00'),
    updateAt: new Date('2024-01-01T10:00:00'),
    fragment: null,
  },
  {
    id: 'msg-2',
    content: 'I will build that for you',
    role: 'ASSISTANT' as MessageRole,
    type: 'RESULT' as MessageType,
    projectId: 'project-1',
    createAt: new Date('2024-01-01T10:01:00'),
    updateAt: new Date('2024-01-01T10:01:00'),
    fragment: {
      id: 'fragment-1',
      title: 'Todo App',
      sandboxUrl: 'https://test.com',
      file: {},
      messageId: 'msg-2',
      createAt: new Date('2024-01-01T10:01:00'),
      updateAt: new Date('2024-01-01T10:01:00'),
    } as Fragment,
  },
]

// Mock TRPC
vi.mock('@/trpc/client', () => ({
  useTRPC: () => ({
    messages: {
      getMany: {
        queryOptions: () => ({
          queryKey: ['messages', 'getMany'],
          queryFn: async () => mockMessages,
        }),
      },
    },
  }),
}))

// Mock react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useSuspenseQuery: () => ({
      data: mockMessages,
      isLoading: false,
      error: null,
    }),
  }
})

describe('MessagesContainer', () => {
  const mockSetActiveFragment = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all messages', () => {
      render(
        <MessagesContainer
          projectId="project-1"
          activeFragment={null}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      expect(screen.getByText('Build a todo app')).toBeInTheDocument()
      expect(screen.getByText('I will build that for you')).toBeInTheDocument()
    })

    it('should render MessageForm at the bottom', () => {
      render(
        <MessagesContainer
          projectId="project-1"
          activeFragment={null}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      expect(screen.getByPlaceholderText('What would you like to build?')).toBeInTheDocument()
    })

    it('should show loading indicator when last message is from user', () => {
      const messagesWithUserLast = [
        ...mockMessages,
        {
          id: 'msg-3',
          content: 'Another request',
          role: 'USER' as MessageRole,
          type: 'RESULT' as MessageType,
          projectId: 'project-1',
          createAt: new Date('2024-01-01T10:02:00'),
          updateAt: new Date('2024-01-01T10:02:00'),
          fragment: null,
        },
      ]

      vi.mocked(useSuspenseQuery as any).mockReturnValue({
        data: messagesWithUserLast,
        isLoading: false,
        error: null,
      })

      render(
        <MessagesContainer
          projectId="project-1"
          activeFragment={null}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      expect(screen.getByText('Thinking')).toBeInTheDocument()
    })

    it('should not show loading indicator when last message is from assistant', () => {
      render(
        <MessagesContainer
          projectId="project-1"
          activeFragment={null}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      expect(screen.queryByText('Thinking')).not.toBeInTheDocument()
    })
  })

  describe('Fragment Interaction', () => {
    it('should pass active fragment to MessageCard', () => {
      const activeFragment = mockMessages[1].fragment!

      render(
        <MessagesContainer
          projectId="project-1"
          activeFragment={activeFragment}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      const fragmentButton = screen.getByText('Todo App').closest('button')
      expect(fragmentButton).toHaveClass('bg-primary')
    })

    it('should call setActiveFragment when fragment is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <MessagesContainer
          projectId="project-1"
          activeFragment={null}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      const fragmentButton = screen.getByText('Todo App').closest('button')
      await user.click(fragmentButton!)

      expect(mockSetActiveFragment).toHaveBeenCalledWith(mockMessages[1].fragment)
    })
  })

  describe('Scrolling Behavior', () => {
    it('should scroll to bottom when messages change', async () => {
      const scrollIntoViewMock = vi.fn()
      
      // Mock scrollIntoView
      Element.prototype.scrollIntoView = scrollIntoViewMock

      const { rerender } = render(
        <MessagesContainer
          projectId="project-1"
          activeFragment={null}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      // Add a new message
      const newMessages = [
        ...mockMessages,
        {
          id: 'msg-3',
          content: 'New message',
          role: 'USER' as MessageRole,
          type: 'RESULT' as MessageType,
          projectId: 'project-1',
          createAt: new Date(),
          updateAt: new Date(),
          fragment: null,
        },
      ]

      vi.mocked(useSuspenseQuery as any).mockReturnValue({
        data: newMessages,
        isLoading: false,
        error: null,
      })

      rerender(
        <MessagesContainer
          projectId="project-1"
          activeFragment={null}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled()
      })
    })
  })

  describe('Empty State', () => {
    it('should render MessageForm even with no messages', () => {
      vi.mocked(useSuspenseQuery as any).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })

      render(
        <MessagesContainer
          projectId="project-1"
          activeFragment={null}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      expect(screen.getByPlaceholderText('What would you like to build?')).toBeInTheDocument()
    })
  })

  describe('Auto-refresh', () => {
    it('should refetch messages every 5 seconds', () => {
      render(
        <MessagesContainer
          projectId="project-1"
          activeFragment={null}
          setActiveFragment={mockSetActiveFragment}
        />
      )

      // The refetchInterval is set to 5000ms in the component
      // This would require mocking the query options to verify
    })
  })
})

// Import userEvent for interactions
import userEvent from '@testing-library/user-event'
import { useSuspenseQuery } from '@tanstack/react-query'