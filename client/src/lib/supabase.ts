import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { mockAuth, isMockMode } from './mock-auth'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using mock authentication')
}

// Create Supabase client
let supabaseClient: any = null
let isSupabaseAvailable = false

// Check if Supabase URL is valid (basic validation)
const isValidSupabaseUrl = (url: string) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('supabase.co') && urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

try {
  if (supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl)) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    isSupabaseAvailable = true
    console.log('Supabase client created successfully')
  } else {
    console.warn('Invalid Supabase URL or missing credentials - using mock authentication')
    isSupabaseAvailable = false
  }
} catch (error) {
  console.warn('Failed to create Supabase client:', error)
  isSupabaseAvailable = false
}

// Create a proxy object that uses mock auth when Supabase is unavailable
export const supabase = {
  auth: {
    signUp: async (credentials: { email: string; password: string }) => {
      if (supabaseClient && isSupabaseAvailable) {
        try {
          return await supabaseClient.auth.signUp(credentials)
        } catch (error) {
          console.warn('Supabase signUp failed, using mock:', error)
          return await mockAuth.signUp(credentials.email, credentials.password)
        }
      }
      console.log('Using mock authentication for signUp')
      return await mockAuth.signUp(credentials.email, credentials.password)
    },
    
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      if (supabaseClient && isSupabaseAvailable) {
        try {
          return await supabaseClient.auth.signInWithPassword(credentials)
        } catch (error) {
          console.warn('Supabase signIn failed, using mock:', error)
          return await mockAuth.signInWithPassword(credentials.email, credentials.password)
        }
      }
      console.log('Using mock authentication for signIn')
      return await mockAuth.signInWithPassword(credentials.email, credentials.password)
    },
    
    signOut: async () => {
      if (supabaseClient && isSupabaseAvailable) {
        try {
          return await supabaseClient.auth.signOut()
        } catch (error) {
          console.warn('Supabase signOut failed, using mock:', error)
          return await mockAuth.signOut()
        }
      }
      console.log('Using mock authentication for signOut')
      return await mockAuth.signOut()
    },
    
    getSession: async () => {
      if (supabaseClient && isSupabaseAvailable) {
        try {
          return await supabaseClient.auth.getSession()
        } catch (error) {
          console.warn('Supabase getSession failed, using mock:', error)
          return await mockAuth.getSession()
        }
      }
      return await mockAuth.getSession()
    },
    
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      if (supabaseClient && isSupabaseAvailable) {
        try {
          return supabaseClient.auth.onAuthStateChange(callback)
        } catch (error) {
          console.warn('Supabase onAuthStateChange failed, using mock:', error)
          return mockAuth.onAuthStateChange(callback)
        }
      }
      return mockAuth.onAuthStateChange(callback)
    }
  },
  
  // Add other Supabase methods as needed
  from: (table: string) => {
    if (supabaseClient) {
      return supabaseClient.from(table)
    }
    // Return mock database operations if needed
    console.warn(`Database operation on table '${table}' attempted but Supabase unavailable`)
    return {
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null })
    }
  },
  
  functions: {
    invoke: async (functionName: string, options?: any) => {
      if (supabaseClient) {
        try {
          return await supabaseClient.functions.invoke(functionName, options)
        } catch (error) {
          console.warn(`Supabase function '${functionName}' failed:`, error)
          return { data: null, error: { message: 'Function unavailable in mock mode' } }
        }
      }
      console.warn(`Function '${functionName}' attempted but Supabase unavailable`)
      return { data: null, error: { message: 'Function unavailable in mock mode' } }
    }
  }
}

// Export flag to indicate if we're using mock mode
export const isUsingMockAuth = !supabaseClient || isMockMode
