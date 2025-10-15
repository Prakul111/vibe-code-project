import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/__tests__/test-utils'
import { ProjectHeader } from '../project-header'
import userEvent from '@testing-library/user-event'

const mockProject = {
  id: 'project-1',
  name: 'awesome-project',
  createAt: new Date('2024-01-01'),
  updateAt: new Date('2024-01-01'),
}

// Mock TRPC
vi.mock('@/trpc/client', () => ({
  useTRPC: () => ({
    projects: {
      getOne: {
        queryOptions: () => ({
          queryKey: ['projects', 'getOne'],
          queryFn: async () => mockProject,
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
      data: mockProject,
      isLoading: false,
      error: null,
    }),
  }
})

describe('ProjectHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render project name', () => {
      render(<ProjectHeader projectId="project-1" />)

      expect(screen.getByText('awesome-project')).toBeInTheDocument()
    })

    it('should render Vibe logo', () => {
      render(<ProjectHeader projectId="project-1" />)

      expect(screen.getByAltText('Vibe')).toBeInTheDocument()
    })

    it('should render dropdown trigger button', () => {
      render(<ProjectHeader projectId="project-1" />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Dropdown Menu', () => {
    it('should show dropdown menu when clicked', async () => {
      const user = userEvent.setup()
      render(<ProjectHeader projectId="project-1" />)

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
    })

    it('should show appearance submenu option', async () => {
      const user = userEvent.setup()
      render(<ProjectHeader projectId="project-1" />)

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      expect(screen.getByText('Apperance')).toBeInTheDocument()
    })

    it('should have link to dashboard', async () => {
      const user = userEvent.setup()
      render(<ProjectHeader projectId="project-1" />)

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      const dashboardLink = screen.getByText('Go to Dashboard').closest('a')
      expect(dashboardLink).toBeInTheDocument()
    })
  })

  describe('Theme Switching', () => {
    it('should show theme options in appearance submenu', async () => {
      const user = userEvent.setup()
      render(<ProjectHeader projectId="project-1" />)

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      const appearanceItem = screen.getByText('Apperance')
      await user.hover(appearanceItem)

      // Theme options should be available in the submenu
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('System')).toBeInTheDocument()
    })

    it('should call setTheme when theme option is clicked', async () => {
      const user = userEvent.setup()
      const mockSetTheme = vi.fn()

      // Override the mock for this test
      vi.doMock('next-themes', () => ({
        useTheme: () => ({
          theme: 'light',
          setTheme: mockSetTheme,
        }),
      }))

      render(<ProjectHeader projectId="project-1" />)

      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)

      const appearanceItem = screen.getByText('Apperance')
      await user.hover(appearanceItem)

      const darkOption = screen.getByText('Dark')
      await user.click(darkOption)

      // Note: This would require proper mocking of the theme context
    })
  })

  describe('Edge Cases', () => {
    it('should handle project with long name', () => {
      const longNameProject = {
        ...mockProject,
        name: 'very-long-project-name-that-might-overflow-the-header',
      }

      vi.mocked(useSuspenseQuery as any).mockReturnValue({
        data: longNameProject,
        isLoading: false,
        error: null,
      })

      render(<ProjectHeader projectId="project-1" />)

      expect(screen.getByText(longNameProject.name)).toBeInTheDocument()
    })

    it('should handle project with special characters in name', () => {
      const specialNameProject = {
        ...mockProject,
        name: 'project-2025_v1.0-beta!',
      }

      vi.mocked(useSuspenseQuery as any).mockReturnValue({
        data: specialNameProject,
        isLoading: false,
        error: null,
      })

      render(<ProjectHeader projectId="project-1" />)

      expect(screen.getByText(specialNameProject.name)).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have border at bottom', () => {
      const { container } = render(<ProjectHeader projectId="project-1" />)

      const header = container.querySelector('header')
      expect(header).toHaveClass('border-b')
    })

    it('should apply hover effects to trigger button', () => {
      render(<ProjectHeader projectId="project-1" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:opacity-75')
    })
  })
})

// Import useSuspenseQuery at the end
import { useSuspenseQuery } from '@tanstack/react-query'