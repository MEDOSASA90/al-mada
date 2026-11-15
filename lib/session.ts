import { cookies } from 'next/headers';
import { createClient } from './supabase/server';
import { DEMO_CLINIC, DEMO_USER, DEMO_DOCTORS } from './demo-data';

export type CurrentSession = {
  user: { id: string; email: string };
  membership: { clinic_id: string; role: string };
  clinic: { name: string; name_ar: string; id: string };
  isDemo: boolean;
};

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieStore = await cookies();
  const demoRoleCookie = cookieStore.get('almada_demo_role')?.value;

  // Offline / Demo mode when Supabase is not configured
  if (!url || !key) {
    const role = demoRoleCookie && ['clinic_owner', 'doctor', 'receptionist', 'accountant'].includes(demoRoleCookie)
      ? demoRoleCookie
      : DEMO_USER.role;

    const email = role === 'receptionist'
      ? 'reception@almada.eg'
      : role === 'doctor'
      ? DEMO_DOCTORS[0].email
      : role === 'accountant'
      ? 'finance@almada.eg'
      : DEMO_USER.email;

    return {
      user: { id: role === 'doctor' ? DEMO_DOCTORS[0].id : DEMO_USER.id, email },
      membership: { clinic_id: DEMO_CLINIC.id, role },
      clinic: { id: DEMO_CLINIC.id, name: DEMO_CLINIC.name, name_ar: DEMO_CLINIC.name_ar },
      isDemo: true,
    };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
      .from('user_clinic_memberships')
      .select('clinic_id, role')
      .limit(1)
      .maybeSingle();

    if (!membership) return null;

    const { data: clinic } = await supabase
      .from('clinics')
      .select('name, name_ar')
      .eq('id', membership.clinic_id)
      .maybeSingle();

    return {
      user: { id: user.id, email: user.email ?? '' },
      membership: { clinic_id: membership.clinic_id, role: membership.role },
      clinic: {
        id: membership.clinic_id,
        name: clinic?.name || 'My Clinic',
        name_ar: clinic?.name_ar || clinic?.name || 'عيادتي',
      },
      isDemo: false,
    };
  } catch {
    // Fallback to demo if connection fails
    return {
      user: { id: DEMO_USER.id, email: DEMO_USER.email },
      membership: { clinic_id: DEMO_CLINIC.id, role: DEMO_USER.role },
      clinic: { id: DEMO_CLINIC.id, name: DEMO_CLINIC.name, name_ar: DEMO_CLINIC.name_ar },
      isDemo: true,
    };
  }
}
