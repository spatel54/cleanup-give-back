'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';

export type CompanyCodeRow = {
  id: string;
  code: string;
  status: 'active' | 'used';
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  used_by_email?: string | null;
};

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return { id: 'bypass-admin', user_metadata: { role: 'admin' } };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}

function generateTenDigitCode(): string {
  let code = '';
  for (let i = 0; i < 10; i += 1) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export async function listCompanyCodes(): Promise<CompanyCodeRow[]> {
  await getAdminUser();
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('company_codes')
    .select('id, code, status, used_by, used_at, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CompanyCodeRow[];
  const usedIds = [...new Set(rows.map((r) => r.used_by).filter(Boolean))] as string[];
  const emailById = new Map<string, string>();

  if (usedIds.length > 0) {
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    for (const u of usersData?.users ?? []) {
      if (usedIds.includes(u.id) && u.email) {
        emailById.set(u.id, u.email);
      }
    }
  }

  return rows.map((row) => ({
    ...row,
    used_by_email: row.used_by ? emailById.get(row.used_by) ?? null : null,
  }));
}

export async function createCompanyCode(): Promise<{ code: string }> {
  const admin = await getAdminUser();
  const supabase = await createServiceClient();

  let lastError: string | null = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateTenDigitCode();
    const { data, error } = await supabase
      .from('company_codes')
      .insert({
        code,
        status: 'active',
        created_by: admin.id === 'bypass-admin' ? null : admin.id,
      })
      .select('id, code')
      .single();

    if (!error && data) {
      await writeAuditLog(supabase, {
        adminUserId: admin.id,
        action: 'company_code_created',
        targetTable: 'company_codes',
        targetId: data.id as string,
        afterValue: { code: data.code },
      });
      revalidatePath('/company-codes');
      return { code: data.code as string };
    }
    lastError = error?.message ?? 'Could not create code';
    if (error?.code !== '23505' && !error?.message?.includes('duplicate')) {
      break;
    }
  }

  throw new Error(lastError ?? 'Could not create company code');
}

export async function deleteCompanyCode(id: string): Promise<void> {
  await deleteCompanyCodes([id]);
}

export async function deleteCompanyCodes(ids: string[]): Promise<{ deleted: number }> {
  const admin = await getAdminUser();
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new Error('No codes selected');
  }

  const supabase = await createServiceClient();
  const { data: existing, error: loadError } = await supabase
    .from('company_codes')
    .select('id, code, status')
    .in('id', uniqueIds);

  if (loadError) {
    throw new Error(loadError.message);
  }

  const rows = existing ?? [];
  if (rows.length === 0) {
    throw new Error('No matching codes found');
  }

  const { error } = await supabase
    .from('company_codes')
    .delete()
    .in(
      'id',
      rows.map((row) => row.id),
    );

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all(
    rows.map((row) =>
      writeAuditLog(supabase, {
        adminUserId: admin.id,
        action: 'company_code_deleted',
        targetTable: 'company_codes',
        targetId: row.id,
        beforeValue: { code: row.code, status: row.status },
      }),
    ),
  );

  revalidatePath('/company-codes');
  return { deleted: rows.length };
}
