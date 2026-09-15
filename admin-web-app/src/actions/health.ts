'use server';

import { assertAdminRequest } from '@/lib/assertAdmin';
import { runAllHealthChecks, type HealthCheckResult } from '@/lib/health-checks';

export async function refreshHealthChecks(): Promise<HealthCheckResult[]> {
  const admin = await assertAdminRequest();
  if (!admin) throw new Error('Unauthorized');
  return runAllHealthChecks();
}
