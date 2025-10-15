import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSandbox, lastAssistantTextMessageContent } from '@/inngest/utils'
import { Sandbox } from '@e2b/code-interpreter'
import type { AgentResult, TextMessage, ContentPart } from '@inngest/agent-kit'

// Mock the Sandbox
vi.mock('@e2b/code-interpreter', () => ({
  Sandbox: {
    connect: vi.fn(),
  },
}))

describe('inngest/utils', () => {
  describe('getSandbox', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should connect to a sandbox with the given ID', async () => {
      const mockSandbox = { id: 'test-sandbox-id' }
      vi.mocked(Sandbox.connect).mockResolvedValue(mockSandbox as any)

      const result = await getSandbox('test-sandbox-id')

      expect(Sandbox.connect).toHaveBeenCalledWith('test-sandbox-id')
      expect(result).toBe(mockSandbox)
    })

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed')
      vi.mocked(Sandbox.connect).mockRejectedValue(error)

      await expect(getSandbox('invalid-id')).rejects.toThrow('Connection failed')
    })

    it('should handle empty sandbox ID', async () => {
      vi.mocked(Sandbox.connect).mockResolvedValue({} as any)
      
      const result = await getSandbox('')
      expect(Sandbox.connect).toHaveBeenCalledWith('')
    })
  })

  describe('lastAssistantTextMessageContent', () => {
    it('should extract content from the last assistant message (string)', () => {
      const result: AgentResult = {
        output: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
          { role: 'assistant', content: 'I am doing well!' },
        ],
      } as AgentResult

      const content = lastAssistantTextMessageContent(result)
      expect(content).toBe('I am doing well!')
    })

    it('should extract content from the last assistant message (content parts)', () => {
      const result: AgentResult = {
        output: [
          { role: 'user', content: 'Hello' },
          { 
            role: 'assistant', 
            content: [
              { type: 'text', text: 'Part 1 ' },
              { type: 'text', text: 'Part 2' },
            ] as ContentPart[],
          },
        ],
      } as AgentResult

      const content = lastAssistantTextMessageContent(result)
      expect(content).toBe('Part 1 Part 2')
    })

    it('should return undefined if no assistant messages exist', () => {
      const result: AgentResult = {
        output: [
          { role: 'user', content: 'Hello' },
          { role: 'user', content: 'Anyone there?' },
        ],
      } as AgentResult

      const content = lastAssistantTextMessageContent(result)
      expect(content).toBeUndefined()
    })

    it('should return undefined if output is empty', () => {
      const result: AgentResult = {
        output: [],
      } as AgentResult

      const content = lastAssistantTextMessageContent(result)
      expect(content).toBeUndefined()
    })

    it('should handle assistant message with no content', () => {
      const result: AgentResult = {
        output: [
          { role: 'assistant', content: undefined },
        ],
      } as any

      const content = lastAssistantTextMessageContent(result)
      expect(content).toBeUndefined()
    })

    it('should handle assistant message with empty string content', () => {
      const result: AgentResult = {
        output: [
          { role: 'assistant', content: '' },
        ],
      } as AgentResult

      const content = lastAssistantTextMessageContent(result)
      expect(content).toBe('')
    })

    it('should handle mixed content types', () => {
      const result: AgentResult = {
        output: [
          { role: 'assistant', content: 'First message' },
          { role: 'user', content: 'User message' },
          { 
            role: 'assistant', 
            content: [
              { type: 'text', text: 'Last ' },
              { type: 'text', text: 'message' },
            ] as ContentPart[],
          },
        ],
      } as AgentResult

      const content = lastAssistantTextMessageContent(result)
      expect(content).toBe('Last message')
    })

    it('should handle empty content parts array', () => {
      const result: AgentResult = {
        output: [
          { role: 'assistant', content: [] as ContentPart[] },
        ],
      } as AgentResult

      const content = lastAssistantTextMessageContent(result)
      expect(content).toBe('')
    })
  })
})