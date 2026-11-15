export type NotificationTemplate = {
  key: string;
  title_ar: string;
  channel: 'whatsapp' | 'sms';
  content: string;
  variables: string[];
  is_active: boolean;
};

export type OutboxMessage = {
  id: string;
  patient_name: string;
  phone: string;
  channel: 'whatsapp' | 'sms';
  template_title: string;
  rendered_text: string;
  status: 'sent' | 'delivered' | 'queued' | 'failed';
  sent_at: string;
};

export const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    key: 'appointment_confirmed',
    title_ar: 'تأكيد حجز الموعد',
    channel: 'whatsapp',
    content: 'مرحبًا بك في عيادة {clinic_name}. تم تأكيد موعدك يوم {date} الساعة {time} مع {doctor_name}. برجاء الحضور قبل الموعد بـ 15 دقيقة.',
    variables: ['clinic_name', 'date', 'time', 'doctor_name'],
    is_active: true,
  },
  {
    key: 'appointment_reminder',
    title_ar: 'تذكير بالموعد (قبل 24 ساعة)',
    channel: 'whatsapp',
    content: 'نذكركم بموعد كشفكم غداً الساعة {time} في عيادة {clinic_name}. إذا رغبتم في تأجيل أو تأكيد الموعد برجاء الرد على هذه الرسالة.',
    variables: ['clinic_name', 'time'],
    is_active: true,
  },
  {
    key: 'queue_turn_alert',
    title_ar: 'تنبيه اقتراب الدور في طابور الكشف',
    channel: 'whatsapp',
    content: 'عزيزي المريض، اقترب دورك في عيادة {clinic_name}. رقم انتظارك {queue_number} ومتبقي أمامك {waiting_ahead} مريض. نرجو التواجد في قاعة الاستقبال.',
    variables: ['clinic_name', 'queue_number', 'waiting_ahead'],
    is_active: true,
  },
  {
    key: 'prescription_ready',
    title_ar: 'رابط الروشتة الإلكترونية وبوابة المريض',
    channel: 'whatsapp',
    content: 'نتمنى لك الشفاء العاجل من عيادة {clinic_name}. يمكنك استعراض وتحميل روشتتك الطبية الرسمية بأمان عبر الرابط: {portal_url}',
    variables: ['clinic_name', 'portal_url'],
    is_active: true,
  },
];

export const DEMO_OUTBOX_MESSAGES: OutboxMessage[] = [
  {
    id: 'msg_001',
    patient_name: 'أحمد محمود حسن',
    phone: '01001234567',
    channel: 'whatsapp',
    template_title: 'تأكيد حجز الموعد',
    rendered_text: 'مرحبًا بك في عيادة المدى التخصصية. تم تأكيد موعدك يوم اليوم الساعة 06:00 م مع د. سارة عثمان.',
    status: 'delivered',
    sent_at: 'اليوم، 04:30 م',
  },
  {
    id: 'msg_002',
    patient_name: 'مريم علي السيد',
    phone: '01229876543',
    channel: 'whatsapp',
    template_title: 'تنبيه اقتراب الدور',
    rendered_text: 'عزيزي المريض، اقترب دورك في عيادة المدى التخصصية. رقم انتظارك 4 ومتبقي أمامك حالة واحدة.',
    status: 'delivered',
    sent_at: 'اليوم، 05:45 م',
  },
  {
    id: 'msg_003',
    patient_name: 'محمود عبد الرحمن',
    phone: '01115554433',
    channel: 'whatsapp',
    template_title: 'رابط الروشتة الإلكترونية',
    rendered_text: 'نتمنى لك الشفاء العاجل من عيادة المدى. يمكنك استعراض وتحميل روشتتك الطبية الرسمية بأمان عبر بوابة المريض.',
    status: 'sent',
    sent_at: 'اليوم، 06:15 م',
  },
];

export async function listNotificationTemplates(): Promise<NotificationTemplate[]> {
  return DEFAULT_TEMPLATES;
}

export async function listOutboxMessages(): Promise<OutboxMessage[]> {
  return DEMO_OUTBOX_MESSAGES;
}

export async function sendTestWhatsAppMessage(phone: string, templateKey: string): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: `تم إرسال الرسالة التجريبية بنجاح إلى الرقم ${phone} عبر محاكي واتساب السحابي (WhatsApp Cloud Sandbox).`,
  };
}
