/** US activity heatmap — shared heat colors, FIPS labels, and Cook County neighborhoods. */

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
  byNeighborhood: GeoUnitStats[];
};

/** Schematic neighborhoods under Cook County (IL) for the deepest drill level. */
export type CountyNeighborhood = {
  id: string;
  name: string;
  countyFips: string;
  path: string;
  labelX: number;
  labelY: number;
};

export const COOK_COUNTY_FIPS = '17031';
export const ILLINOIS_FIPS = '17';

export const COUNTY_NEIGHBORHOODS: CountyNeighborhood[] = [
  {
    id: 'harbor',
    name: 'Harbor Point',
    countyFips: COOK_COUNTY_FIPS,
    path: 'M20 40 L140 28 L155 110 L35 125 Z',
    labelX: 85,
    labelY: 75,
  },
  {
    id: 'lakefront',
    name: 'Lakefront',
    countyFips: COOK_COUNTY_FIPS,
    path: 'M140 28 L260 20 L275 105 L155 110 Z',
    labelX: 205,
    labelY: 65,
  },
  {
    id: 'riverside',
    name: 'Riverside',
    countyFips: COOK_COUNTY_FIPS,
    path: 'M260 20 L380 35 L365 120 L275 105 Z',
    labelX: 320,
    labelY: 70,
  },
  {
    id: 'midtown',
    name: 'Midtown',
    countyFips: COOK_COUNTY_FIPS,
    path: 'M35 125 L155 110 L170 195 L50 210 Z',
    labelX: 100,
    labelY: 160,
  },
  {
    id: 'university',
    name: 'University District',
    countyFips: COOK_COUNTY_FIPS,
    path: 'M155 110 L275 105 L290 190 L170 195 Z',
    labelX: 220,
    labelY: 150,
  },
  {
    id: 'oak-hills',
    name: 'Oak Hills',
    countyFips: COOK_COUNTY_FIPS,
    path: 'M275 105 L365 120 L380 200 L290 190 Z',
    labelX: 325,
    labelY: 155,
  },
  {
    id: 'southside',
    name: 'Southside',
    countyFips: COOK_COUNTY_FIPS,
    path: 'M50 210 L170 195 L185 290 L40 300 Z',
    labelX: 110,
    labelY: 250,
  },
  {
    id: 'industrial',
    name: 'Industrial Corridor',
    countyFips: COOK_COUNTY_FIPS,
    path: 'M170 195 L290 190 L310 285 L185 290 Z',
    labelX: 235,
    labelY: 240,
  },
];

/** @deprecated Prefer COUNTY_NEIGHBORHOODS — kept for older imports. */
export const METRO_NEIGHBORHOODS = COUNTY_NEIGHBORHOODS;
export const METRO_NAME = 'United States';

export type NeighborhoodStats = GeoUnitStats;

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

export function neighborhoodsForCounty(countyFips: string): CountyNeighborhood[] {
  return COUNTY_NEIGHBORHOODS.filter((n) => n.countyFips === countyFips);
}
