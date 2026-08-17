'use client';

import { DebtorsView } from '@/components/DebtorsView';

export default function AdminDebtorsPage() {
  return <DebtorsView apiBase="/admin" />;
}
