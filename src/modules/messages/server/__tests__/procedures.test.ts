import { describe, it, expect, vi, beforeEach } from 'vitest'
import { messageRouter } from '../procedures'
import { prisma } from '@/lib/db'
import { inngest } from '@/inngest/client'
import type { MessageRole, MessageType } from '@/generated/prisma'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/inngest/client', () => ({
  inngest: {
    send: vi.fn(),
  },
}))

describe('messageRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMany', () => {
    it('should retrieve messages for a project', async () => {
      const mockMessages = [
        {
          id: '1',
          content: 'Test message 1',
          role: 'USER' as MessageRole,
          type: 'RESULT' as MessageType,
          projectId: 'project-1',
          createAt: new Date(),
          updateAt: new Date(),
          fragment: null,
        },
        {
          id: '2',
          content: 'Test message 2',
          role: 'ASSISTANT' as MessageRole,
          type: 'RESULT' as MessageType,
          projectId: 'project-1',
          createAt: new Date(),
          updateAt: new Date(),
          fragment: {
            id: 'fragment-1',
            title: 'Test Fragment',
            sandboxUrl: 'https://example.com',
            file: {},
            messageId: '2',
            createAt: new Date(),
            updateAt: new Date(),
          },
        },
      ]

      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages)

      const caller = messageRouter.createCaller({} as any)
      const result = await caller.getMany({ projectId: 'project-1' })

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        include: { fragment: true },
        orderBy: { updateAt: 'asc' },
      })
      expect(result).toEqual(mockMessages)
    })

    it('should return empty array for project with no messages', async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue([])

      const caller = messageRouter.createCaller({} as any)
      const result = await caller.getMany({ projectId: 'empty-project' })

      expect(result).toEqual([])
    })

    it('should validate projectId is required', async () => {
      const caller = messageRouter.createCaller({} as any)

      await expect(
        caller.getMany({ projectId: '' })
      ).rejects.toThrow()
    })

    it('should order messages by updateAt ascending', async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue([])

      const caller = messageRouter.createCaller({} as any)
      await caller.getMany({ projectId: 'project-1' })

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updateAt: 'asc' },
        })
      )
    })
  })

  describe('create', () => {
    it('should create a new message and trigger inngest event', async () => {
      const mockMessage = {
        id: 'new-message-id',
        content: 'Build a todo app',
        role: 'USER' as MessageRole,
        type: 'RESULT' as MessageType,
        projectId: 'project-1',
        createAt: new Date(),
        updateAt: new Date(),
      }

      vi.mocked(prisma.message.create).mockResolvedValue(mockMessage as any)
      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any)

      const caller = messageRouter.createCaller({} as any)
      const result = await caller.create({
        value: 'Build a todo app',
        projectId: 'project-1',
      })

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          content: 'Build a todo app',
          role: 'USER',
          type: 'RESULT',
        },
      })

      expect(inngest.send).toHaveBeenCalledWith({
        name: 'code-agent/run',
        data: {
          value: 'Build a todo app',
          projectId: 'project-1',
        },
      })

      expect(result).toEqual(mockMessage)
    })

    it('should validate message is required', async () => {
      const caller = messageRouter.createCaller({} as any)

      await expect(
        caller.create({ value: '', projectId: 'project-1' })
      ).rejects.toThrow()
    })

    it('should validate message is not too long', async () => {
      const caller = messageRouter.createCaller({} as any)
      const longMessage = 'a'.repeat(10001)

      await expect(
        caller.create({ value: longMessage, projectId: 'project-1' })
      ).rejects.toThrow()
    })

    it('should validate projectId is required', async () => {
      const caller = messageRouter.createCaller({} as any)

      await expect(
        caller.create({ value: 'Test message', projectId: '' })
      ).rejects.toThrow()
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.message.create).mockRejectedValue(
        new Error('Database error')
      )

      const caller = messageRouter.createCaller({} as any)

      await expect(
        caller.create({ value: 'Test', projectId: 'project-1' })
      ).rejects.toThrow('Database error')
    })

    it('should accept message at max length (10000 chars)', async () => {
      const maxMessage = 'a'.repeat(10000)
      const mockMessage = {
        id: 'msg-id',
        content: maxMessage,
        role: 'USER' as MessageRole,
        type: 'RESULT' as MessageType,
        projectId: 'project-1',
        createAt: new Date(),
        updateAt: new Date(),
      }

      vi.mocked(prisma.message.create).mockResolvedValue(mockMessage as any)
      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any)

      const caller = messageRouter.createCaller({} as any)
      const result = await caller.create({
        value: maxMessage,
        projectId: 'project-1',
      })

      expect(result.content).toEqual(maxMessage)
    })
  })
})