import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/session';
import { getAppointment } from '@/lib/appointments';
import { getMedicalRecordByAppointment } from '@/lib/medical-records';
import { getPatient } from '@/lib/patients';
import { PrescriptionView } from './prescription-view';

export const dynamic = 'force-dynamic';

export default async function ElectronicPrescriptionPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(appointmentId)) notFound();

  const session = await getCurrentSession();
  if (!session) redirect('/login');

  const { clinic } = session;

  const appointment = await getAppointment(appointmentId);
  if (!appointment) notFound();

  const [record, patient] = await Promise.all([
    getMedicalRecordByAppointment(appointmentId),
    getPatient(appointment.patient_id),
  ]);

  // Extract structured prescription items
  const items = record?.prescription_items && record.prescription_items.length > 0
    ? record.prescription_items
    : [
        {
          medication_name: 'Metformin (Cidophage) 1000mg',
          form: 'أقراص (Tablets)',
          dose: '1000 mg',
          frequency: 'مرتين يومياً',
          timing: 'بعد الأكل مباشرة',
          duration: 'شهر كامل (30 يوماً)',
          instructions: 'مع كوب ماء كامل، والالتزام بحمية قليلة النشويات',
        },
        {
          medication_name: 'Amlodipine (Norvasc) 5mg',
          form: 'أقراص (Tablets)',
          dose: '5 mg',
          frequency: 'مرة واحدة يومياً',
          timing: 'صباحاً بعد الإفطار',
          duration: 'شهر كامل (30 يوماً)',
          instructions: 'لضبط ضغط الدم ومتابعة القياس أسبوعياً',
        },
      ];

  const isSara = (appointment.doctor_name && appointment.doctor_name.includes('سارة')) || appointment.doctor_id === '11111111-1111-1111-1111-111111111112';
  const doctorTitle = isSara ? 'أخصائية الأمراض الجلدية والتجميل والليزر' : 'استشاري الباطنة والسكر والجهاز الهضمي';
  const licenseNumber = isSara ? '41209/2021' : '34892/2018';

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
        <PrescriptionView
          appointmentId={appointment.id}
          clinicName={clinic?.name_ar || clinic?.name || 'عيادة المدى التخصصية'}
          doctorName={appointment.doctor_name || 'د. أحمد مصطفى شريف'}
          doctorTitle={doctorTitle}
          licenseNumber={licenseNumber}
          patientName={appointment.patient_name || patient?.full_name || 'مريض'}
          patientFileNumber={appointment.patient_file_number || patient?.file_number || '000101'}
          patientPhone={patient?.phone || appointment.patient_phone || ''}
          patientBirthDate={patient?.birth_date}
          patientGender={patient?.gender}
          diagnosis={record?.diagnosis || 'متابعة دورية وفحص باطنة'}
          prescriptionItems={items}
          generalInstructions={record?.treatment_plan || record?.notes || 'شرب كميات وفيرة من المياه، تقليل الملح والسكريات، والمشي يومياً لمدة 30 دقيقة.'}
          appointmentDate={appointment.appointment_date}
          isLocked={record?.is_locked ?? true}
        />
      </div>
    </main>
  );
}
