import { describe, it, expect, vi, beforeEach } from 'vitest'
import { projectsRouter } from '../procedures'
import { prisma } from '@/lib/db'
import { inngest } from '@/inngest/client'
import { TRPCError } from '@trpc/server'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
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

vi.mock('random-word-slugs', () => ({
  generateSlug: vi.fn(() => 'test-project-slug'),
}))

describe('projectsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOne', () => {
    it('should retrieve a project by id', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'test-project',
        createAt: new Date(),
        updateAt: new Date(),
      }

      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject)

      const caller = projectsRouter.createCaller({} as any)
      const result = await caller.getOne({ id: 'project-1' })

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      })
      expect(result).toEqual(mockProject)
    })

    it('should throw NOT_FOUND error when project does not exist', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

      const caller = projectsRouter.createCaller({} as any)

      await expect(
        caller.getOne({ id: 'non-existent' })
      ).rejects.toThrow('Project not found')
    })

    it('should validate id is required', async () => {
      const caller = projectsRouter.createCaller({} as any)

      await expect(
        caller.getOne({ id: '' })
      ).rejects.toThrow()
    })

    it('should handle database errors', async () => {
      vi.mocked(prisma.project.findUnique).mockRejectedValue(
        new Error('Database connection error')
      )

      const caller = projectsRouter.createCaller({} as any)

      await expect(
        caller.getOne({ id: 'project-1' })
      ).rejects.toThrow('Database connection error')
    })
  })

  describe('getMany', () => {
    it('should retrieve all projects ordered by updateAt desc', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'project-one',
          createAt: new Date('2024-01-01'),
          updateAt: new Date('2024-01-02'),
        },
        {
          id: 'project-2',
          name: 'project-two',
          createAt: new Date('2024-01-03'),
          updateAt: new Date('2024-01-04'),
        },
      ]

      vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects)

      const caller = projectsRouter.createCaller({} as any)
      const result = await caller.getMany()

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        orderBy: { updateAt: 'desc' },
      })
      expect(result).toEqual(mockProjects)
    })

    it('should return empty array when no projects exist', async () => {
      vi.mocked(prisma.project.findMany).mockResolvedValue([])

      const caller = projectsRouter.createCaller({} as any)
      const result = await caller.getMany()

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      vi.mocked(prisma.project.findMany).mockRejectedValue(
        new Error('Database error')
      )

      const caller = projectsRouter.createCaller({} as any)

      await expect(caller.getMany()).rejects.toThrow('Database error')
    })
  })

  describe('create', () => {
    it('should create a new project with generated slug and trigger inngest', async () => {
      const mockProject = {
        id: 'new-project-id',
        name: 'test-project-slug',
        createAt: new Date(),
        updateAt: new Date(),
      }

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject)
      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any)

      const caller = projectsRouter.createCaller({} as any)
      const result = await caller.create({ value: 'Build a landing page' })

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'test-project-slug',
          message: {
            create: {
              content: 'Build a landing page',
              role: 'USER',
              type: 'RESULT',
            },
          },
        },
      })

      expect(inngest.send).toHaveBeenCalledWith({
        name: 'code-agent/run',
        data: {
          value: 'Build a landing page',
          projectId: 'new-project-id',
        },
      })

      expect(result).toEqual(mockProject)
    })

    it('should validate value is required', async () => {
      const caller = projectsRouter.createCaller({} as any)

      await expect(
        caller.create({ value: '' })
      ).rejects.toThrow()
    })

    it('should validate value is not too long', async () => {
      const caller = projectsRouter.createCaller({} as any)
      const longValue = 'a'.repeat(10001)

      await expect(
        caller.create({ value: longValue })
      ).rejects.toThrow()
    })

    it('should accept value at max length (10000 chars)', async () => {
      const maxValue = 'a'.repeat(10000)
      const mockProject = {
        id: 'project-id',
        name: 'test-slug',
        createAt: new Date(),
        updateAt: new Date(),
      }

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject)
      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any)

      const caller = projectsRouter.createCaller({} as any)
      const result = await caller.create({ value: maxValue })

      expect(result).toEqual(mockProject)
    })

    it('should handle database errors during creation', async () => {
      vi.mocked(prisma.project.create).mockRejectedValue(
        new Error('Unique constraint violation')
      )

      const caller = projectsRouter.createCaller({} as any)

      await expect(
        caller.create({ value: 'Test project' })
      ).rejects.toThrow('Unique constraint violation')
    })

    it('should create nested message with correct data', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'test-slug',
        createAt: new Date(),
        updateAt: new Date(),
      }

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject)
      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-id'] } as any)

      const caller = projectsRouter.createCaller({} as any)
      await caller.create({ value: 'Create a blog' })

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: {
              create: {
                content: 'Create a blog',
                role: 'USER',
                type: 'RESULT',
              },
            },
          }),
        })
      )
    })
  })
})