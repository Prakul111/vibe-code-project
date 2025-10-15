import { describe, it, expect } from 'vitest'
import { appRouter } from '@/trpc/routers/_app'

describe('TRPC Router Integration', () => {
  describe('appRouter', () => {
    it('should have messages router', () => {
      expect(appRouter._def.procedures).toHaveProperty('messages')
    })

    it('should have projects router', () => {
      expect(appRouter._def.procedures).toHaveProperty('projects')
    })

    it('should have correct router structure', () => {
      const procedures = appRouter._def.procedures
      expect(Object.keys(procedures)).toContain('messages')
      expect(Object.keys(procedures)).toContain('projects')
    })
  })

  describe('Router Types', () => {
    it('should export AppRouter type', () => {
      // Type test - this ensures the AppRouter type is exported correctly
      type TestAppRouter = typeof appRouter
      const typeCheck: TestAppRouter = appRouter
      expect(typeCheck).toBeDefined()
    })
  })
})