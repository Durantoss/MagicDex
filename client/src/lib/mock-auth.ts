// Mock authentication system for testing when Supabase is unavailable
import { User, Session, AuthError } from '@supabase/supabase-js'

// Generate mock user ID
const generateMockId = () => `mock-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Create mock user object
const createMockUser = (email: string, id: string): User => ({
  id,
  email,
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  factors: []
})

// Create mock session object
const createMockSession = (user: User): Session => ({
  access_token: `mock-access-token-${Date.now()}`,
  refresh_token: `mock-refresh-token-${Date.now()}`,
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user
})

// Mock user data with a default test user
const mockUsers: Array<{ email: string; password: string; id: string }> = [
  { email: 'test@example.com', password: 'password123', id: 'test-user-1' }
]

// Mock session storage - start with a test user signed in
const testUser = createMockUser('test@example.com', 'test-user-1')
const testSession = createMockSession(testUser)
let currentSession: Session | null = testSession
let currentUser: User | null = testUser

// Store test session in localStorage
if (typeof localStorage !== 'undefined') {
  localStorage.setItem('mock-auth-session', JSON.stringify(testSession))
}

export const mockAuth = {
  // Mock sign up
  signUp: async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email)
    if (existingUser) {
      return {
        error: {
          message: 'User already registered',
          status: 400
        } as AuthError
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        error: {
          message: 'Invalid email format',
          status: 400
        } as AuthError
      }
    }
    
    // Validate password length
    if (password.length < 6) {
      return {
        error: {
          message: 'Password must be at least 6 characters',
          status: 400
        } as AuthError
      }
    }
    
    // Create mock user
    const userId = generateMockId()
    mockUsers.push({ email, password, id: userId })
    
    console.log('Mock user created:', { email, id: userId })
    return { error: null }
  },
  
  // Mock sign in
  signInWithPassword: async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Find user
    const user = mockUsers.find(u => u.email === email && u.password === password)
    if (!user) {
      return {
        error: {
          message: 'Invalid login credentials',
          status: 400
        } as AuthError
      }
    }
    
    // Create session
    const mockUser = createMockUser(user.email, user.id)
    const mockSession = createMockSession(mockUser)
    
    currentUser = mockUser
    currentSession = mockSession
    
    // Store in localStorage for persistence
    localStorage.setItem('mock-auth-session', JSON.stringify(mockSession))
    
    console.log('Mock user signed in:', { email: user.email, id: user.id })
    return { error: null }
  },
  
  // Mock sign out
  signOut: async (): Promise<{ error: AuthError | null }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    currentUser = null
    currentSession = null
    localStorage.removeItem('mock-auth-session')
    
    console.log('Mock user signed out')
    return { error: null }
  },
  
  // Mock get session
  getSession: async (): Promise<{ data: { session: Session | null } }> => {
    // Try to restore from localStorage
    const storedSession = localStorage.getItem('mock-auth-session')
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession)
        // Check if session is expired
        if (session.expires_at > Math.floor(Date.now() / 1000)) {
          currentSession = session
          currentUser = session.user
        } else {
          localStorage.removeItem('mock-auth-session')
          currentSession = null
          currentUser = null
        }
      } catch (e) {
        localStorage.removeItem('mock-auth-session')
        currentSession = null
        currentUser = null
      }
    }
    
    return { data: { session: currentSession } }
  },
  
  // Mock auth state change listener
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    // Return a mock subscription
    const subscription = {
      unsubscribe: () => {
        console.log('Mock auth state change listener unsubscribed')
      }
    }
    
    // Immediately call with current session
    setTimeout(() => {
      callback('INITIAL_SESSION', currentSession)
    }, 100)
    
    return { data: { subscription } }
  }
}

// Export flag to indicate mock mode
export const isMockMode = true
