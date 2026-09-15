/**
 * Donations integration with Supabase — standalone Contribute flow.
 */

import { supabase, getUserId } from './supabase';

export type DonationRow = {
  id: string;
  user_id: string | null;
  amount_cents: number;
  status: string;
  donor_email: string | null;
  payment_reference: string | null;
  stripe_payment_intent_id: string | null;
  payment_method_label: string | null;
  created_at: string;
};

export async function getUserDonations(): Promise<{
  success: boolean;
  error: string | null;
  donations: DonationRow[];
}> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured', donations: [] };
    }

    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'Unable to identify user', donations: [] };
    }

    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[donations] Failed to fetch donations:', error);
      return { success: false, error: error.message, donations: [] };
    }

    return { success: true, error: null, donations: (data ?? []) as DonationRow[] };
  } catch (error) {
    console.error('[donations] Unexpected error fetching donations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
      donations: [],
    };
  }
}

export async function getDonationById(donationId: string): Promise<{
  success: boolean;
  error: string | null;
  donation: DonationRow | null;
}> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured', donation: null };
    }

    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'Unable to identify user', donation: null };
    }

    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[donations] Failed to fetch donation:', error);
      return { success: false, error: error.message, donation: null };
    }

    return { success: true, error: null, donation: (data as DonationRow | null) ?? null };
  } catch (error) {
    console.error('[donations] Unexpected error fetching donation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred',
      donation: null,
    };
  }
}
