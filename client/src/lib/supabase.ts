import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { mockAuth, isMockMode } from './mock-auth'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fallback configuration for when environment variables are missing
const FALLBACK_SUPABASE_URL = 'https://reeijsdzozdvnbkbngid.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZWlqc2R6b3pkdm5ia2JuZ2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzg3NDcsImV4cCI6MjA3MTcxNDc0N30.apGeAHd5fu6DY5N5BLP5J4cdZEvirPODfCNftGBaiaU'

// Use environment variables if available, otherwise use fallback
const finalSupabaseUrl = supabaseUrl || FALLBACK_SUPABASE_URL
const finalSupabaseAnonKey = supabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY

// Create Supabase client
let supabaseClient: any = null
let isSupabaseAvailable = false

// Check if Supabase URL is valid (supports both production and local development)
const isValidSupabaseUrl = (url: string) => {
  try {
    const urlObj = new URL(url)
    // Support both production (.supabase.co) and local development (localhost)
    return (urlObj.hostname.includes('supabase.co') || urlObj.hostname === 'localhost') && 
           (urlObj.protocol === 'https:' || urlObj.protocol === 'http:')
  } catch {
    return false
  }
}

try {
  if (finalSupabaseUrl && finalSupabaseAnonKey && isValidSupabaseUrl(finalSupabaseUrl)) {
    supabaseClient = createClient<Database>(finalSupabaseUrl, finalSupabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    isSupabaseAvailable = true
    console.log('Supabase client created successfully for:', finalSupabaseUrl)
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Using fallback Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
    }
  } else {
    console.error('Invalid Supabase configuration')
    // Create a mock client that will gracefully handle errors
    supabaseClient = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
      })
    }
  }
} catch (error) {
  console.error('Failed to create Supabase client:', error)
  // Don't throw error, create mock client instead
  supabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase initialization failed' } }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase initialization failed' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: { message: 'Supabase initialization failed' } }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase initialization failed' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase initialization failed' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Supabase initialization failed' } })
    })
  }
}

// Export the Supabase client
export const supabase = supabaseClient

// Export flag to indicate if Supabase is properly configured
export const isSupabaseConfigured = isSupabaseAvailable

// Export flag to indicate if we're using mock mode (always false in production)
export const isUsingMockAuth = false
