import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/__tests__/test-utils'
import { MessageLoading } from '../message-loading'

describe('MessageLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render Vibe logo and name', () => {
    render(<MessageLoading />)

    expect(screen.getByAltText('Vibe')).toBeInTheDocument()
    expect(screen.getByText('Vibe')).toBeInTheDocument()
  })

  it('should display initial loading message', () => {
    render(<MessageLoading />)

    expect(screen.getByText('Thinking')).toBeInTheDocument()
  })

  it('should cycle through messages', async () => {
    render(<MessageLoading />)

    expect(screen.getByText('Thinking')).toBeInTheDocument()

    // Advance time by 2 seconds
    vi.advanceTimersByTime(2000)

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    // Advance time by another 2 seconds
    vi.advanceTimersByTime(2000)

    await waitFor(() => {
      expect(screen.getByText('Analyzing your request')).toBeInTheDocument()
    })
  })

  it('should loop back to first message after reaching the end', async () => {
    render(<MessageLoading />)

    // Advance through all messages (8 messages * 2 seconds = 16 seconds)
    vi.advanceTimersByTime(16000)

    await waitFor(() => {
      expect(screen.getByText('Thinking')).toBeInTheDocument()
    })
  })

  it('should have pulsing animation on messages', () => {
    render(<MessageLoading />)

    const messageElement = screen.getByText('Thinking')
    expect(messageElement).toHaveClass('animate-pulse')
  })

  it('should display all messages in sequence', async () => {
    render(<MessageLoading />)

    const messages = [
      'Thinking',
      'Loading...',
      'Analyzing your request',
      'Building your website',
      'Crafting Components',
      'Optimizing Layouts',
      'Adding final touches',
      'Almost ready',
    ]

    for (let i = 0; i < messages.length; i++) {
      await waitFor(() => {
        expect(screen.getByText(messages[i])).toBeInTheDocument()
      })
      vi.advanceTimersByTime(2000)
    }
  })

  it('should cleanup interval on unmount', () => {
    const { unmount } = render(<MessageLoading />)
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})