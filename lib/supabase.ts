import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cachedClient: SupabaseClient | null = null

function createStubClient(): SupabaseClient {
  const noop = async () => ({ data: null, error: null }) as any
  const stubAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  } as any
  return {
    auth: stubAuth,
    from: () => ({ select: noop, insert: noop, update: noop, delete: noop, eq: () => ({ select: noop }) } as any),
  } as unknown as SupabaseClient
}

export function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    // Avoid build-time crashes; runtime without envs will be limited
    return createStubClient()
  }
  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })
  return cachedClient
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabase() as any
      return client[prop]
    },
  }
) as unknown as SupabaseClient

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      donations: {
        Row: {
          id: string
          user_id: string
          campaign_title: string
          amount: number
          currency: string
          donation_date: string
          campaign_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          campaign_title: string
          amount: number
          currency?: string
          donation_date: string
          campaign_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          campaign_title?: string
          amount?: number
          currency?: string
          donation_date?: string
          campaign_image_url?: string | null
          created_at?: string
        }
      }
      donation_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          target_amount: number
          current_amount: number
          currency: string
          target_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target_amount: number
          current_amount?: number
          currency?: string
          target_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target_amount?: number
          current_amount?: number
          currency?: string
          target_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
