import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { mockAuth, isMockMode } from './mock-auth'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// For production, we require valid Supabase credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

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
  if (supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl)) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    isSupabaseAvailable = true
    console.log('Supabase client created successfully for:', supabaseUrl)
  } else {
    throw new Error('Invalid Supabase URL or credentials')
  }
} catch (error) {
  console.error('Failed to create Supabase client:', error)
  throw error
}

// Export the Supabase client directly for production use
export const supabase = supabaseClient

// Export flag to indicate if we're using mock mode (always false in production)
export const isUsingMockAuth = false
