import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2')
      expect(result).toBe('px-4 py-2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'excluded')
      expect(result).toBe('base conditional')
    })

    it('should merge Tailwind classes without conflicts', () => {
      const result = cn('px-4', 'px-6')
      expect(result).toBe('px-6')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end')
      expect(result).toBe('base end')
    })

    it('should handle empty strings', () => {
      const result = cn('', 'class1', '', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      })
      expect(result).toBe('class1 class3')
    })

    it('should merge complex Tailwind variants', () => {
      const result = cn(
        'bg-red-500 hover:bg-red-600',
        'bg-blue-500 hover:bg-blue-600'
      )
      expect(result).toBe('hover:bg-blue-600 bg-blue-500')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should merge responsive classes correctly', () => {
      const result = cn('text-sm md:text-base', 'text-xs md:text-lg')
      expect(result).toBe('text-xs md:text-lg')
    })
  })
})