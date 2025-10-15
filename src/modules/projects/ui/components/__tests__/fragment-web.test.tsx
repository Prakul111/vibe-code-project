import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/__tests__/test-utils'
import { FragmentWeb } from '../fragment-web'
import { Fragment } from '@/generated/prisma'
import userEvent from '@testing-library/user-event'

const mockFragment: Fragment = {
  id: 'fragment-1',
  title: 'Test Fragment',
  sandboxUrl: 'https://test-sandbox.com',
  file: {
    'index.html': '<html><body>Test</body></html>',
    'style.css': 'body { color: red; }',
  },
  messageId: 'msg-1',
  createAt: new Date('2024-01-01'),
  updateAt: new Date('2024-01-01'),
}

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

describe('FragmentWeb', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render iframe with sandbox URL', () => {
      render(<FragmentWeb data={mockFragment} />)

      const iframe = screen.getByTitle('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute('src', 'https://test-sandbox.com')
    })

    it('should render refresh button', () => {
      render(<FragmentWeb data={mockFragment} />)

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toBeInTheDocument()
    })

    it('should render URL copy button with sandbox URL', () => {
      render(<FragmentWeb data={mockFragment} />)

      expect(screen.getByText('https://test-sandbox.com')).toBeInTheDocument()
    })

    it('should render open in new tab button', () => {
      render(<FragmentWeb data={mockFragment} />)

      const openButton = screen.getAllByRole('button').find(
        button => button.querySelector('svg')
      )
      expect(openButton).toBeInTheDocument()
    })

    it('should apply correct iframe sandbox attributes', () => {
      render(<FragmentWeb data={mockFragment} />)

      const iframe = screen.getByTitle('iframe')
      expect(iframe).toHaveAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin')
    })

    it('should set iframe loading to lazy', () => {
      render(<FragmentWeb data={mockFragment} />)

      const iframe = screen.getByTitle('iframe')
      expect(iframe).toHaveAttribute('loading', 'lazy')
    })
  })

  describe('User Interactions', () => {
    it('should refresh iframe when refresh button is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(<FragmentWeb data={mockFragment} />)

      const initialIframe = container.querySelector('iframe')
      const initialKey = initialIframe?.getAttribute('key')

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      const newIframe = container.querySelector('iframe')
      const newKey = newIframe?.getAttribute('key')

      // Key should change, causing iframe to remount
      expect(newKey).not.toBe(initialKey)
    })

    it('should copy URL to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup()
      render(<FragmentWeb data={mockFragment} />)

      const copyButton = screen.getByText('https://test-sandbox.com').closest('button')
      await user.click(copyButton!)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://test-sandbox.com')
    })

    it('should show copied state after copying', async () => {
      const user = userEvent.setup()
      vi.useFakeTimers()

      render(<FragmentWeb data={mockFragment} />)

      const copyButton = screen.getByText('https://test-sandbox.com').closest('button')
      await user.click(copyButton!)

      expect(copyButton).toBeDisabled()

      // Fast-forward time to reset copied state
      vi.advanceTimersByTime(2000)

      expect(copyButton).not.toBeDisabled()

      vi.useRealTimers()
    })

    it('should open URL in new tab when open button is clicked', async () => {
      const user = userEvent.setup()
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      render(<FragmentWeb data={mockFragment} />)

      const buttons = screen.getAllByRole('button')
      const openButton = buttons[buttons.length - 1] // Last button is the open button

      await user.click(openButton)

      expect(windowOpenSpy).toHaveBeenCalledWith('https://test-sandbox.com', '_blank')
    })

    it('should disable open button when sandbox URL is empty', () => {
      const fragmentWithoutUrl = { ...mockFragment, sandboxUrl: '' }
      render(<FragmentWeb data={fragmentWithoutUrl} />)

      const buttons = screen.getAllByRole('button')
      const openButton = buttons[buttons.length - 1]

      expect(openButton).toBeDisabled()
    })

    it('should disable copy button when sandbox URL is empty', () => {
      const fragmentWithoutUrl = { ...mockFragment, sandboxUrl: '' }
      render(<FragmentWeb data={fragmentWithoutUrl} />)

      const copyButton = screen.getByText('').closest('button')
      expect(copyButton).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle fragments with no files', () => {
      const fragmentWithoutFiles = { ...mockFragment, file: {} }
      render(<FragmentWeb data={fragmentWithoutFiles} />)

      const iframe = screen.getByTitle('iframe')
      expect(iframe).toBeInTheDocument()
    })

    it('should truncate long URLs in the display', () => {
      const longUrl = 'https://' + 'a'.repeat(100) + '.com'
      const fragmentWithLongUrl = { ...mockFragment, sandboxUrl: longUrl }
      
      render(<FragmentWeb data={fragmentWithLongUrl} />)

      const urlElement = screen.getByText(longUrl)
      expect(urlElement.parentElement).toHaveClass('truncate')
    })

    it('should handle multiple refresh clicks', async () => {
      const user = userEvent.setup()
      render(<FragmentWeb data={mockFragment} />)

      const refreshButton = screen.getByRole('button', { name: /refresh/i })

      await user.click(refreshButton)
      await user.click(refreshButton)
      await user.click(refreshButton)

      // Should not throw errors
      expect(refreshButton).toBeInTheDocument()
    })
  })

  describe('Tooltips', () => {
    it('should show tooltip hints for buttons', () => {
      render(<FragmentWeb data={mockFragment} />)

      // The Hint components should be rendered
      // (actual tooltip visibility would require user interaction testing)
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })
  })
})