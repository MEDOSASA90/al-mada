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
    title_ar: 'تأكيد حجز الموعد + لوكيشن خرائط جوجل 📍',
    channel: 'whatsapp',
    content: 'مرحبًا بك في {clinic_name}. تم تأكيد موعد كشفك يوم {date} الساعة {time} مع {doctor_name} في ({branch_name}).\n📍 موقع الفرع على خرائط جوجل: {maps_url}\nبرجاء الحضور قبل الموعد بـ 15 دقيقة لتسهيل إجراءات الاستقبال.',
    variables: ['clinic_name', 'date', 'time', 'doctor_name', 'branch_name', 'maps_url'],
    is_active: true,
  },
  {
    key: 'queue_turn_alert',
    title_ar: 'تنبيه اقتراب الدور في طابور الكشف (Queue ETA) 📢',
    channel: 'whatsapp',
    content: 'عزيزي المريض، اقترب دورك في {clinic_name}. رقم انتظارك ({queue_number}) ومتبقي أمامك ({waiting_ahead}) مريض، الوقت المتوقع لدخولك: حوالي {eta_minutes} دقيقة. نرجو التواجد في صالة الانتظار.',
    variables: ['clinic_name', 'queue_number', 'waiting_ahead', 'eta_minutes'],
    is_active: true,
  },
  {
    key: 'appointment_reminder',
    title_ar: 'تذكير بالموعد القادم (قبل 24 ساعة)',
    channel: 'whatsapp',
    content: 'نذكركم بموعد كشفكم غداً الساعة {time} في {clinic_name} ({branch_name}). إذا رغبتم في تأكيد أو تعديل الموعد، برجاء الرد على هذه الرسالة أو الاتصال بالعيادة.',
    variables: ['clinic_name', 'time', 'branch_name'],
    is_active: true,
  },
  {
    key: 'prescription_ready',
    title_ar: 'رابط الروشتة الإلكترونية وبوابة المريض 💊',
    channel: 'whatsapp',
    content: 'نتمنى لك الشفاء العاجل من {clinic_name}. تم اعتماد روشتتك الطبية الرسمية ويمكنك استعراضها وتحميلها بصيغة PDF فوراً عبر بوابتك الطبية الآمنة:\n🔗 {portal_url}',
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
    template_title: 'تأكيد حجز الموعد + لوكيشن خرائط جوجل 📍',
    rendered_text: 'مرحبًا بك في عيادة المدى التخصصية. تم تأكيد موعد كشفك يوم اليوم الساعة 06:00 م مع د. سارة عثمان في (الفرع الرئيسي - مصر الجديدة).\n📍 موقع الفرع على خرائط جوجل: https://maps.google.com/?q=Heliopolis+AlMada',
    status: 'delivered',
    sent_at: 'اليوم، 04:30 م',
  },
  {
    id: 'msg_002',
    patient_name: 'مريم علي السيد',
    phone: '01229876543',
    channel: 'whatsapp',
    template_title: 'تنبيه اقتراب الدور (Queue ETA)',
    rendered_text: 'عزيزي المريض، اقترب دورك في عيادة المدى. رقم انتظارك (4) ومتبقي أمامك (1) مريض، الوقت المتوقع: حوالي 15 دقيقة. نرجو التواجد في صالة الانتظار.',
    status: 'delivered',
    sent_at: 'اليوم، 05:45 م',
  },
  {
    id: 'msg_003',
    patient_name: 'محمود عبد الرحمن',
    phone: '01115554433',
    channel: 'whatsapp',
    template_title: 'رابط الروشتة الإلكترونية وبوابة المريض 💊',
    rendered_text: 'نتمنى لك الشفاء العاجل من عيادة المدى. تم اعتماد روشتتك الطبية الرسمية، يمكنك استعراضها وتحميلها PDF عبر:\n🔗 https://al-mada-pink.vercel.app/portal',
    status: 'delivered',
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
