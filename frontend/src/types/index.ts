export interface User {
  id: string;
  name: string;
  phone: string;
  username?: string | null;
  specialty?: string | null;
  role: 'DIRECTOR' | 'ADMIN' | 'DOCTOR' | 'PATIENT';
  isActive: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

export interface PatientRecord {
  id: string;
  fullName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  phone: string;
  address?: string;
  occupation?: string;
  diagnosis: string;
  dailyAnalysis?: string;
  treatmentHistory?: string;
  treatmentPlan?: string;
  paymentType: 'CASH' | 'CLICK' | 'DEBT';
  consentImage?: string;
  doctorId: string;
  doctor?: { id: string; name: string };
  visitDate: string;
  amount: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctor?: { id: string; name: string };
  source: 'WEB' | 'TELEGRAM';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  serviceType?: string | null;
  scheduledAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Debt {
  id: string;
  patientRecordId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  amount: number;
  deadline: string;
  isPaid: boolean;
  paidAt?: string | null;
  reminderSent: boolean;
  lastReminderAt?: string | null;
  autoSmsEnabled: boolean;
  createdAt: string;
  patientRecord?: { visitDate: string };
}

export interface PrepaidBalance {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

// Clinic shareholders / owners ("Mulkdorlar")
export interface Owner {
  id: string;
  name: string;
  title?: string | null;
  phone?: string | null;
  ownershipPct: number;
  capitalBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnersResponse {
  owners: Owner[];
  totalEquity: number;
  totalPct: number;
}

export interface ServicePrice {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  price: number;
  isActive: boolean;
}

export interface DashboardStats {
  revenue: { total: number; today: number; monthly: number; yearly: number };
  expenses: { total: number; today: number; monthly: number; yearly: number };
  profit: { total: number; monthly: number; yearly: number };
  budget: { monthly: number; used: number; percentUsed: number };
  utilities: { total: number; byCategory: Record<string, number> };
  equity: { total: number; ownersCount: number; totalOwnershipPct: number };
  patients: { total: number; today: number; monthly: number };
  totalDebt: number;
  commissionRate: number;
  doctors: Array<{
    id: string;
    name: string;
    specialty?: string | null;
    username?: string | null;
    patientCount: number;
    totalRevenue: number;
    salary: number;
  }>;
}

export interface DoctorDashboard {
  patients: { today: number; monthly: number };
  revenue: { today: number; monthly: number };
  commission: { today: number; monthly: number };
  commissionRate: number;
  pendingAppointments: number;
}

export type Settings = Record<string, string>;

export interface FinancialReport {
  generatedAt: string;
  period: string;
  income: number;
  expenses: number;
  profit: number;
  outstandingDebt: number;
  owners: Array<{ name: string; title?: string | null; ownershipPct: number; capitalBalance: number }>;
  doctors: Array<{ name: string; specialty?: string | null; revenue: number; salary: number }>;
}
