'use server';

import { forwardGeocodeAddress, type ForwardGeocodeError, type ForwardGeocodeHit } from '@/lib/forward-geocode';

export type VerifyAddressResult = ForwardGeocodeHit | ForwardGeocodeError;

/** Client blur/verify for the event address field (Census → Google fallback). */
export async function verifyEventAddress(address: string): Promise<VerifyAddressResult> {
  return forwardGeocodeAddress(address);
}
