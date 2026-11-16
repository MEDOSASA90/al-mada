import { createClient } from '@/lib/supabase/server';
import { DEMO_QUEUE_TICKETS } from './demo-data';
import { isDemoSession } from './session';

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
  patient_phone?: string;
  doctor_name?: string;
};

export async function listActiveQueueTickets(): Promise<QueueTicket[]> {
  if (await isDemoSession()) {
    return DEMO_QUEUE_TICKETS as QueueTicket[];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('queue_tickets')
      .select('id,ticket_number,status,priority,appointment_id,patient_id,doctor_id,called_at,served_at,created_at')
      .in('status', ['waiting', 'called', 'in_service'])
      .order('priority', { ascending: false })
      .order('ticket_number', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_QUEUE_TICKETS as QueueTicket[];
    }
    const tickets = data as QueueTicket[];

    const patientIds = Array.from(new Set(tickets.map((t) => t.patient_id).filter(Boolean)));
    const doctorIds = Array.from(new Set(tickets.map((t) => t.doctor_id).filter((id): id is string => Boolean(id))));

    const [patientsRes, doctorsRes] = await Promise.all([
      patientIds.length > 0 ? supabase.from('patients').select('id,full_name,phone').in('id', patientIds) : { data: [] },
      doctorIds.length > 0 ? supabase.from('staff_profiles').select('id,full_name').in('id', doctorIds) : { data: [] },
    ]);

    const pMap = new Map((patientsRes.data ?? []).map((p) => [p.id, p]));
    const dMap = new Map((doctorsRes.data ?? []).map((d) => [d.id, d.full_name]));

    return tickets.map((t) => {
      const pat = pMap.get(t.patient_id);
      return {
        ...t,
        patient_name: pat?.full_name ?? 'مريض',
        patient_phone: pat?.phone,
        doctor_name: t.doctor_id ? dMap.get(t.doctor_id) ?? 'طبيب' : undefined,
      };
    });
  } catch {
    return DEMO_QUEUE_TICKETS as QueueTicket[];
  }
}
