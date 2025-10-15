import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/__tests__/test-utils'
import { MessageCard } from '../message-card'
import { MessageRole, MessageType, Fragment } from '@/generated/prisma'
import userEvent from '@testing-library/user-event'

const mockFragment: Fragment = {
  id: 'fragment-1',
  title: 'Test Fragment',
  sandboxUrl: 'https://test-sandbox.com',
  file: { 'index.html': '<html></html>' },
  messageId: 'msg-1',
  createAt: new Date('2024-01-01'),
  updateAt: new Date('2024-01-01'),
}

describe('MessageCard', () => {
  describe('User Message', () => {
    it('should render user message with correct styling', () => {
      render(
        <MessageCard
          content="Hello, build me a website"
          role="USER"
          fragment={null}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      expect(screen.getByText('Hello, build me a website')).toBeInTheDocument()
    })

    it('should not display fragment for user messages', () => {
      render(
        <MessageCard
          content="User message"
          role="USER"
          fragment={mockFragment}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      expect(screen.queryByText('Test Fragment')).not.toBeInTheDocument()
    })

    it('should render long user messages correctly', () => {
      const longMessage = 'A'.repeat(500)
      render(
        <MessageCard
          content={longMessage}
          role="USER"
          fragment={null}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })
  })

  describe('Assistant Message', () => {
    it('should render assistant message with logo and timestamp', () => {
      const testDate = new Date('2024-01-15T10:30:00')
      render(
        <MessageCard
          content="I will help you build that"
          role="ASSISTANT"
          fragment={null}
          createdAt={testDate}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      expect(screen.getByText('I will help you build that')).toBeInTheDocument()
      expect(screen.getByText('Vibe')).toBeInTheDocument()
      expect(screen.getByAltText('vibe')).toBeInTheDocument()
    })

    it('should render fragment card when fragment exists', () => {
      render(
        <MessageCard
          content="Here is your website"
          role="ASSISTANT"
          fragment={mockFragment}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      expect(screen.getByText('Test Fragment')).toBeInTheDocument()
      expect(screen.getByText('Preview')).toBeInTheDocument()
    })

    it('should not render fragment card when type is ERROR', () => {
      render(
        <MessageCard
          content="An error occurred"
          role="ASSISTANT"
          fragment={mockFragment}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="ERROR"
        />
      )

      expect(screen.queryByText('Test Fragment')).not.toBeInTheDocument()
    })

    it('should apply error styling when type is ERROR', () => {
      const { container } = render(
        <MessageCard
          content="Something went wrong"
          role="ASSISTANT"
          fragment={null}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="ERROR"
        />
      )

      const messageElement = screen.getByText('Something went wrong').closest('div')
      expect(messageElement).toHaveClass('text-red-700')
    })

    it('should call onFragmentClick when fragment is clicked', async () => {
      const user = userEvent.setup()
      const onFragmentClick = vi.fn()

      render(
        <MessageCard
          content="Here is your website"
          role="ASSISTANT"
          fragment={mockFragment}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={onFragmentClick}
          type="RESULT"
        />
      )

      const fragmentButton = screen.getByText('Test Fragment').closest('button')
      await user.click(fragmentButton!)

      expect(onFragmentClick).toHaveBeenCalledWith(mockFragment)
    })

    it('should highlight active fragment', () => {
      render(
        <MessageCard
          content="Active fragment"
          role="ASSISTANT"
          fragment={mockFragment}
          createdAt={new Date()}
          isActiveFragment={true}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      const fragmentButton = screen.getByText('Test Fragment').closest('button')
      expect(fragmentButton).toHaveClass('bg-primary')
    })

    it('should not highlight inactive fragment', () => {
      render(
        <MessageCard
          content="Inactive fragment"
          role="ASSISTANT"
          fragment={mockFragment}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      const fragmentButton = screen.getByText('Test Fragment').closest('button')
      expect(fragmentButton).not.toHaveClass('bg-primary')
      expect(fragmentButton).toHaveClass('bg-muted')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(
        <MessageCard
          content=""
          role="USER"
          fragment={null}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      expect(screen.queryByRole('article')).toBeInTheDocument()
    })

    it('should handle special characters in content', () => {
      const specialContent = '<script>alert("test")</script> & "quotes" \'apostrophe\''
      render(
        <MessageCard
          content={specialContent}
          role="USER"
          fragment={null}
          createdAt={new Date()}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      expect(screen.getByText(specialContent)).toBeInTheDocument()
    })

    it('should format timestamp correctly', () => {
      const testDate = new Date('2024-01-15T14:30:45')
      render(
        <MessageCard
          content="Test message"
          role="ASSISTANT"
          fragment={null}
          createdAt={testDate}
          isActiveFragment={false}
          onFragmentClick={vi.fn()}
          type="RESULT"
        />
      )

      // The timestamp should be visible on hover
      const timestampElement = screen.getByText(/14:30 on Jan 15, 2024/)
      expect(timestampElement).toBeInTheDocument()
    })
  })
})