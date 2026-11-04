import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/**
 * Browser / RLS-scoped client.
 * Every query runs under the signed-in user's JWT, so Postgres Row Level
 * Security is the only thing standing between one clinic and another.
 */
export function getBrowserClient(): SupabaseClient {
  return createClient(
    required('NEXT_PUBLIC_SUPABASE_URL', url),
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey),
  );
}

/**
 * Service-role client — SERVER SIDE ONLY.
 * Bypasses RLS, so every query MUST filter by clinic_id explicitly.
 * Never import this from a client component.
 */
export function getAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getAdminClient() must never run in the browser');
  }
  return createClient(
    required('NEXT_PUBLIC_SUPABASE_URL', url),
    required('SUPABASE_SERVICE_ROLE_KEY', serviceKey),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type Patient = {
  id: string;
  clinic_id: string;
  file_number: string;
  full_name: string;
  phone: string;
  email: string | null;
  gender: 'male' | 'female' | 'other' | null;
  birth_date: string | null;
  is_active: boolean;
  created_at: string;
};
