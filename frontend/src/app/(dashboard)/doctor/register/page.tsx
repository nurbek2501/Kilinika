'use client';

import { PatientRegistrationForm } from '@/components/PatientRegistrationForm';

export default function DoctorPatientRegistration() {
  return <PatientRegistrationForm endpoint="/doctor/patients" showDoctorSelect={false} />;
}
