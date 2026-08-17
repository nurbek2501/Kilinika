'use client';

import { PatientRegistrationForm } from '@/components/PatientRegistrationForm';

export default function AdminPatientRegistration() {
  return <PatientRegistrationForm endpoint="/admin/patients" showDoctorSelect />;
}
