import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

/**
 * Custom render function that wraps components with common providers
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options })
}

/**
 * Mock Supabase client for testing
 */
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signIn: jest.fn(() => Promise.resolve({ data: null, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  },
}

/**
 * Mock conversation data for testing
 */
export const mockConversation = {
  id: 'test-conversation-id',
  userId: 'test-user-id',
  skillId: 'moments-copywriter',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  messages: [],
}

/**
 * Mock message data for testing
 */
export const mockMessage = {
  id: 'test-message-id',
  role: 'user' as const,
  content: 'Test message content',
  timestamp: new Date('2025-01-01'),
  attachments: [],
}

/**
 * Mock skill data for testing
 */
export const mockSkill = {
  id: 'moments-copywriter',
  name: '朋友圈文案',
  description: '生成朋友圈文案',
  icon: 'MessageSquare',
  category: '文案创作',
  inputTypes: ['text', 'voice', 'image'],
  source: 'official' as const,
}

export * from '@testing-library/react'
export { customRender as render }
