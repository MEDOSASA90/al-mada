import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const target = request.nextUrl.searchParams.get('next') ?? '/';
  const safeTarget = target.startsWith('/') && !target.startsWith('//') ? target : '/';
  const redirectUrl = new URL(safeTarget, request.url);
  const token = request.nextUrl.searchParams.get('token');
  if (token) redirectUrl.searchParams.set('token', token);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'confirmation_failed');
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.redirect(redirectUrl);
}
