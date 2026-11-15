import { createClient } from '@/lib/supabase/server';
import { DEMO_QUEUE_TICKETS } from './demo-data';

export type QueueTicket = {
  id: string;
  ticket_number: number;
  status: 'waiting' | 'called' | 'in_service' | 'done' | 'skipped' | 'cancelled';
  priority: number;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string | null;
  called_at: string | null;
  served_at: string | null;
  created_at: string;
  patient_name?: string;
  doctor_name?: string;
};

export async function listActiveQueueTickets(): Promise<QueueTicket[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEMO_QUEUE_TICKETS as QueueTicket[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('queue_tickets')
    .select('id,ticket_number,status,priority,appointment_id,patient_id,doctor_id,called_at,served_at,created_at')
    .in('status', ['waiting', 'called', 'in_service'])
    .order('priority', { ascending: false })
    .order('ticket_number', { ascending: true });

  if (error) return [];
  const tickets = (data ?? []) as QueueTicket[];
  if (tickets.length === 0) return [];

  const patientIds = Array.from(new Set(tickets.map((t) => t.patient_id).filter(Boolean)));
  const doctorIds = Array.from(new Set(tickets.map((t) => t.doctor_id).filter((id): id is string => Boolean(id))));

  const [patientsRes, doctorsRes] = await Promise.all([
    patientIds.length > 0 ? supabase.from('patients').select('id,full_name').in('id', patientIds) : { data: [] },
    doctorIds.length > 0 ? supabase.from('staff_profiles').select('id,full_name').in('id', doctorIds) : { data: [] },
  ]);

  const pMap = new Map((patientsRes.data ?? []).map((p) => [p.id, p.full_name]));
  const dMap = new Map((doctorsRes.data ?? []).map((d) => [d.id, d.full_name]));

  return tickets.map((t) => ({
    ...t,
    patient_name: pMap.get(t.patient_id) ?? 'مريض',
    doctor_name: t.doctor_id ? dMap.get(t.doctor_id) ?? 'طبيب' : undefined,
  }));
}
