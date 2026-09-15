/** Default ship-from — matches mobile pickup copy in `orgLocations.ts`. */

export type ShipFromAddress = {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
};

export function getShipFromAddress(): ShipFromAddress {
  return {
    name: process.env.SHIP_FROM_NAME?.trim() || 'Clean Up Give Back',
    street1: process.env.SHIP_FROM_STREET1?.trim() || '100 Sample Street',
    city: process.env.SHIP_FROM_CITY?.trim() || 'Example City',
    state: process.env.SHIP_FROM_STATE?.trim() || 'IL',
    zip: process.env.SHIP_FROM_ZIP?.trim() || '00000',
    country: 'US',
    phone: process.env.SHIP_FROM_PHONE?.trim() || '',
    email: process.env.SHIP_FROM_EMAIL?.trim() || 'support@example.org',
  };
}
