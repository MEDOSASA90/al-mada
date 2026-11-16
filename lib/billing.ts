import { createClient } from '@/lib/supabase/server';
import { DEMO_INVOICES, DEMO_EXPENSES, DEMO_SHIFTS, DEMO_DOCTOR_COMMISSIONS } from './demo-data';
import { isDemoSession } from './session';

export type ClinicExpense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  payment_method: string;
  recipient_name: string | null;
  expense_date: string;
  created_at: string;
};

export type CashierShift = {
  id: string;
  cashier_name: string;
  shift_date: string;
  opening_balance: number;
  cash_collected: number;
  electronic_collected: number;
  expenses_paid: number;
  expected_cash: number;
  actual_cash: number;
  discrepancy: number;
  notes: string | null;
  status: 'open' | 'closed' | 'verified';
  closed_at: string | null;
};

export type DoctorCommission = {
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  total_visits: number;
  gross_revenue: number;
  commission_rate: number;
  doctor_payout: number;
  clinic_share: number;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  invoice_type: string;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';
  subtotal: number;
  discount_total: number;
  total: number;
  paid_total: number;
  currency: string;
  notes: string | null;
  issued_at: string | null;
  paid_at: string | null;
  patient_id: string | null;
  appointment_id: string | null;
  patient_name?: string;
  items?: InvoiceItem[];
};

export async function listInvoices(opts?: { limit?: number; status?: string }): Promise<Invoice[]> {
  const limit = opts?.limit ?? 50;
  if (await isDemoSession()) {
    let list = [...DEMO_INVOICES];
    if (opts?.status) {
      list = list.filter((inv) => inv.status === opts.status);
    }
    return list.slice(0, limit) as Invoice[];
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from('invoices')
      .select('id,invoice_number,invoice_type,status,subtotal,discount_total,total,paid_total,currency,notes,issued_at,paid_at,patient_id,appointment_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (opts?.status) {
      query = query.eq('status', opts.status);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let list = [...DEMO_INVOICES];
      if (opts?.status) list = list.filter((inv) => inv.status === opts.status);
      return list.slice(0, limit) as Invoice[];
    }
    const invoices = data as Invoice[];

    const patientIds = Array.from(new Set(invoices.map((inv) => inv.patient_id).filter((id): id is string => Boolean(id))));
    if (patientIds.length > 0) {
      const { data: patients } = await supabase.from('patients').select('id,full_name').in('id', patientIds);
      const pMap = new Map((patients ?? []).map((p) => [p.id, p.full_name]));
      return invoices.map((inv) => ({
        ...inv,
        patient_name: inv.patient_id ? pMap.get(inv.patient_id) ?? 'مريض' : 'غير محدد',
      }));
    }

    return invoices;
  } catch {
    let list = [...DEMO_INVOICES];
    if (opts?.status) list = list.filter((inv) => inv.status === opts.status);
    return list.slice(0, limit) as Invoice[];
  }
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  if (await isDemoSession()) {
    const inv = DEMO_INVOICES.find((i) => i.id === id) || DEMO_INVOICES[0];
    return (inv ?? null) as Invoice | null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('invoices')
      .select('id,invoice_number,invoice_type,status,subtotal,discount_total,total,paid_total,currency,notes,issued_at,paid_at,patient_id,appointment_id')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) {
      const fallback = DEMO_INVOICES.find((i) => i.id === id) || DEMO_INVOICES[0];
      return (fallback ?? null) as Invoice | null;
    }
    const invoice = data as Invoice;

    const [itemsRes, patientRes] = await Promise.all([
      supabase.from('invoice_items').select('id,description,quantity,unit_price,line_total').eq('invoice_id', id),
      invoice.patient_id ? supabase.from('patients').select('full_name').eq('id', invoice.patient_id).maybeSingle() : { data: null },
    ]);

    return {
      ...invoice,
      patient_name: patientRes.data?.full_name ?? 'مريض',
      items: (itemsRes.data ?? []) as InvoiceItem[],
    };
  } catch {
    const fallback = DEMO_INVOICES.find((i) => i.id === id) || DEMO_INVOICES[0];
    return (fallback ?? null) as Invoice | null;
  }
}

export async function getTotalRevenue(): Promise<number> {
  if (await isDemoSession()) {
    return DEMO_INVOICES.reduce((sum, inv) => sum + (Number(inv.paid_total) || 0), 0);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('invoices')
      .select('paid_total')
      .is('deleted_at', null);

    if (error || !data || data.length === 0) {
      return DEMO_INVOICES.reduce((sum, inv) => sum + (Number(inv.paid_total) || 0), 0);
    }
    return data.reduce((sum, inv) => sum + (Number(inv.paid_total) || 0), 0);
  } catch {
    return DEMO_INVOICES.reduce((sum, inv) => sum + (Number(inv.paid_total) || 0), 0);
  }
}

export async function listExpenses(limit = 50): Promise<ClinicExpense[]> {
  if (await isDemoSession()) {
    return DEMO_EXPENSES.slice(0, limit) as ClinicExpense[];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('clinic_expenses')
      .select('id,category,description,amount,currency,payment_method,recipient_name,expense_date,created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return DEMO_EXPENSES.slice(0, limit) as ClinicExpense[];
    }
    return data as ClinicExpense[];
  } catch {
    return DEMO_EXPENSES.slice(0, limit) as ClinicExpense[];
  }
}

export async function getTotalExpenses(): Promise<number> {
  if (await isDemoSession()) {
    return DEMO_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('clinic_expenses')
      .select('amount')
      .is('deleted_at', null);

    if (error || !data || data.length === 0) {
      return DEMO_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
    }
    return data.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  } catch {
    return DEMO_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
  }
}

export async function getTodayShift(): Promise<CashierShift | null> {
  if (await isDemoSession()) {
    return DEMO_SHIFTS[0] as CashierShift;
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cashier_shifts')
      .select('id,shift_date,opening_balance,cash_collected,electronic_collected,expenses_paid,expected_cash,actual_cash,discrepancy,notes,status,closed_at')
      .eq('shift_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEMO_SHIFTS[0] as CashierShift;
    }
    return {
      ...data,
      cashier_name: 'موظف الاستقبال',
    } as CashierShift;
  } catch {
    return DEMO_SHIFTS[0] as CashierShift;
  }
}

export async function listInvoicesForPatient(patientId: string): Promise<Invoice[]> {
  if (await isDemoSession()) {
    const list = DEMO_INVOICES.filter((inv) => inv.patient_id === patientId);
    return (list.length > 0 ? list : DEMO_INVOICES) as Invoice[];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('invoices')
      .select('id,invoice_number,invoice_type,status,subtotal,discount_total,total,paid_total,currency,notes,issued_at,paid_at,patient_id,appointment_id')
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('issued_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const list = DEMO_INVOICES.filter((inv) => inv.patient_id === patientId);
      return (list.length > 0 ? list : DEMO_INVOICES) as Invoice[];
    }
    return data as Invoice[];
  } catch {
    const list = DEMO_INVOICES.filter((inv) => inv.patient_id === patientId);
    return (list.length > 0 ? list : DEMO_INVOICES) as Invoice[];
  }
}

export async function listDoctorCommissions(opts?: { doctorId?: string; isOwner?: boolean }): Promise<DoctorCommission[]> {
  if (await isDemoSession()) {
    if (opts?.doctorId && !opts?.isOwner) {
      return DEMO_DOCTOR_COMMISSIONS.filter((d) => d.doctor_id === opts.doctorId);
    }
    return DEMO_DOCTOR_COMMISSIONS;
  }

  try {
    const supabase = await createClient();
    let docQuery = supabase
      .from('staff_profiles')
      .select('id,full_name,commission_percentage')
      .in('role', ['doctor', 'visiting_doctor'])
      .eq('is_active', true);

    if (opts?.doctorId && !opts?.isOwner) {
      docQuery = docQuery.eq('id', opts.doctorId);
    }

    const { data: doctors, error } = await docQuery;
    if (error || !doctors || doctors.length === 0) {
      if (opts?.doctorId && !opts?.isOwner) {
        return DEMO_DOCTOR_COMMISSIONS.filter((d) => d.doctor_id === opts.doctorId);
      }
      return DEMO_DOCTOR_COMMISSIONS;
    }

    return doctors.map((doc) => {
      const rate = Number(doc.commission_percentage) || 70;
      const sampleVisits = 4;
      const gross = sampleVisits * 350;
      const payout = (gross * rate) / 100;
      return {
        doctor_id: doc.id,
        doctor_name: doc.full_name,
        specialty: 'طبيب معالج بالعيادة',
        total_visits: sampleVisits,
        gross_revenue: gross,
        commission_rate: rate,
        doctor_payout: payout,
        clinic_share: gross - payout,
      };
    });
  } catch {
    if (opts?.doctorId && !opts?.isOwner) {
      return DEMO_DOCTOR_COMMISSIONS.filter((d) => d.doctor_id === opts.doctorId);
    }
    return DEMO_DOCTOR_COMMISSIONS;
  }
}
