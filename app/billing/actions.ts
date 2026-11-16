'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isDemoSession } from '@/lib/session';

export type BillingFormState = { message: string; success: boolean; invoiceId?: string };

function validUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export async function createInvoiceAction(
  _previous: BillingFormState,
  formData: FormData
): Promise<BillingFormState> {
  const patientId = String(formData.get('patient_id') ?? '');
  const appointmentId = String(formData.get('appointment_id') ?? '') || null;
  const branchId = String(formData.get('branch_id') ?? '') || null;
  const discountTotal = Number(formData.get('discount_total') ?? 0);
  const notes = String(formData.get('notes') ?? '').trim() || null;

  // Read line items
  const itemDescs = formData.getAll('item_description').map(String);
  const itemQtys = formData.getAll('item_quantity').map(Number);
  const itemPrices = formData.getAll('item_price').map(Number);

  if (!validUuid(patientId)) {
    return { message: 'اختر المريض من السجل.', success: false };
  }

  const items = [];
  for (let i = 0; i < itemDescs.length; i++) {
    const desc = itemDescs[i]?.trim();
    if (desc) {
      items.push({
        description: desc,
        quantity: itemQtys[i] && itemQtys[i] > 0 ? itemQtys[i] : 1,
        unit_price: itemPrices[i] && itemPrices[i] >= 0 ? itemPrices[i] : 0,
      });
    }
  }

  if (items.length === 0) {
    return { message: 'أضف بنداً واحداً على الأقل للفاتورة (مثال: كشف، استشارة، غيار، تحليل).', success: false };
  }

  const isDemo = await isDemoSession();
  if (isDemo) {
    revalidatePath('/billing');
    return { message: 'تم إصدار الفاتورة بنجاح (وضع المعاينة التجريبي).', success: true, invoiceId: '77777777-7777-7777-7777-777777777771' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { data: invoiceId, error } = await supabase.rpc('create_invoice_for_current_user', {
    p_patient_id: patientId,
    p_appointment_id: appointmentId,
    p_branch_id: branchId,
    p_items: items,
    p_discount_total: discountTotal,
    p_notes: notes,
  });

  if (error) {
    return { message: `تعذّر إصدار الفاتورة: ${error.message}`, success: false };
  }

  revalidatePath('/billing');
  revalidatePath('/');
  return { message: 'تم إصدار الفاتورة بنجاح.', success: true, invoiceId: String(invoiceId) };
}

export async function recordPaymentAction(
  invoiceId: string,
  amount: number,
  method: string,
  referenceNo?: string
): Promise<{ ok: boolean; message: string }> {
  if (!validUuid(invoiceId) || amount <= 0) {
    return { ok: false, message: 'بيانات الدفعة غير صالحة.' };
  }

  const isDemo = await isDemoSession();
  if (isDemo) {
    revalidatePath(`/billing/${invoiceId}`);
    return { ok: true, message: 'تم تسجيل تحصيل الدفعة بنجاح وتحديث حساب الفاتورة (وضع المعاينة التجريبي).' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.' };

  const { error } = await supabase.rpc('record_payment_for_current_user', {
    p_invoice_id: invoiceId,
    p_amount: amount,
    p_method: method,
    p_reference_no: referenceNo ?? null,
  });

  if (error) {
    return { ok: false, message: `تعذّر تسجيل الدفعة: ${error.message}` };
  }

  revalidatePath(`/billing/${invoiceId}`);
  revalidatePath('/billing');
  revalidatePath('/');
  return { ok: true, message: 'تم تسجيل تحصيل الدفعة بنجاح وتحديث حساب الفاتورة.' };
}

export async function addExpenseAction(_previous: BillingFormState, formData: FormData): Promise<BillingFormState> {
  const category = String(formData.get('category') ?? 'supplies');
  const description = String(formData.get('description') ?? '').trim();
  const amount = Number(formData.get('amount') ?? 0);
  const paymentMethod = String(formData.get('payment_method') ?? 'cash');
  const recipient = String(formData.get('recipient_name') ?? '').trim() || null;

  if (description.length < 2 || amount <= 0) {
    return { message: 'اكتب وصفاً صالحاً ومبلغاً أكبر من صفر.', success: false };
  }

  const isDemo = await isDemoSession();
  if (isDemo) {
    revalidatePath('/billing');
    return { message: 'تم تسجيل المصروف بنجاح وخصمه من عهدة الدرج (وضع المعاينة التجريبي).', success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.', success: false };

  const { error } = await supabase.rpc('record_clinic_expense_for_current_user', {
    p_category: category,
    p_description: description,
    p_amount: amount,
    p_payment_method: paymentMethod,
    p_recipient: recipient,
  });

  if (error) {
    return { message: `تعذّر تسجيل المصروف: ${error.message}`, success: false };
  }

  revalidatePath('/billing');
  return { message: 'تم تسجيل المصروف النثري بنجاح.', success: true };
}

export async function closeShiftAction(actualCash: number, notes?: string): Promise<{ ok: boolean; message: string }> {
  if (actualCash < 0) {
    return { ok: false, message: 'المبلغ الفعلي المدخل غير صالح.' };
  }

  const isDemo = await isDemoSession();
  if (isDemo) {
    revalidatePath('/billing');
    return { ok: true, message: 'تم تقفيل وردية الكاشير بنجاح واعتماد النقدية الفعلية (وضع المعاينة التجريبي).' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'انتهت الجلسة. سجّل الدخول مرة أخرى.' };

  const { error } = await supabase.rpc('close_cashier_shift_for_current_user', {
    p_actual_cash: actualCash,
    p_notes: notes ?? null,
  });

  if (error) {
    return { ok: false, message: `تعذّر تقفيل الوردية: ${error.message}` };
  }

  revalidatePath('/billing');
  return { ok: true, message: 'تم إغلاق وتقفيل وردية الكاشير بنجاح.' };
}
