/** US activity heatmap - shared heat colors, FIPS labels, and stats types. */

export type GeoUnitStats = {
  id: string;
  name: string;
  sessionCount: number;
  hours: number;
  underReview: number;
};

export type GeoActivityBundle = {
  byState: GeoUnitStats[];
  byCounty: GeoUnitStats[];
  /** @deprecated Neighborhood-tier stats are now computed client-side from real census
   *  tracts in `UsHeatmap` - always empty here. Kept only to avoid a breaking type change. */
  byNeighborhood: GeoUnitStats[];
};

export const ILLINOIS_FIPS = '17';

export const STATE_FIPS_NAME: Record<string, string> = {
  '01': 'Alabama',
  '02': 'Alaska',
  '04': 'Arizona',
  '05': 'Arkansas',
  '06': 'California',
  '08': 'Colorado',
  '09': 'Connecticut',
  '10': 'Delaware',
  '11': 'District of Columbia',
  '12': 'Florida',
  '13': 'Georgia',
  '15': 'Hawaii',
  '16': 'Idaho',
  '17': 'Illinois',
  '18': 'Indiana',
  '19': 'Iowa',
  '20': 'Kansas',
  '21': 'Kentucky',
  '22': 'Louisiana',
  '23': 'Maine',
  '24': 'Maryland',
  '25': 'Massachusetts',
  '26': 'Michigan',
  '27': 'Minnesota',
  '28': 'Mississippi',
  '29': 'Missouri',
  '30': 'Montana',
  '31': 'Nebraska',
  '32': 'Nevada',
  '33': 'New Hampshire',
  '34': 'New Jersey',
  '35': 'New Mexico',
  '36': 'New York',
  '37': 'North Carolina',
  '38': 'North Dakota',
  '39': 'Ohio',
  '40': 'Oklahoma',
  '41': 'Oregon',
  '42': 'Pennsylvania',
  '44': 'Rhode Island',
  '45': 'South Carolina',
  '46': 'South Dakota',
  '47': 'Tennessee',
  '48': 'Texas',
  '49': 'Utah',
  '50': 'Vermont',
  '51': 'Virginia',
  '53': 'Washington',
  '54': 'West Virginia',
  '55': 'Wisconsin',
  '56': 'Wyoming',
};

/** Heat color from brand greens → cream for low. */
export function heatFill(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity));
  if (t <= 0) return '#f0eded';
  if (t < 0.25) return '#dcefe0';
  if (t < 0.5) return '#7fb089';
  if (t < 0.75) return '#3d8f5c';
  return '#007536';
}

export function heatText(intensity: number): string {
  return intensity >= 0.5 ? '#ffffff' : '#1c1b1b';
}
