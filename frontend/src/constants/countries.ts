export type Country = {
  iso2: string;
  name: string;
  dialCode: string;
  /** Unicode regional-indicator flag emoji */
  flag: string;
  /** Max national number digits (approx.); used for input length */
  maxDigits: number;
};

/** Build a flag emoji from an ISO 3166-1 alpha-2 code. */
function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
    .join('');
}

function c(
  iso2: string,
  name: string,
  dialCode: string,
  maxDigits = 15,
): Country {
  return { iso2, name, dialCode, flag: flagEmoji(iso2), maxDigits };
}

/**
 * Dial-code list for the onboarding phone country picker.
 * Sorted alphabetically by name; US is selected by default in the UI.
 */
export const COUNTRIES: Country[] = [
  c('AF', 'Afghanistan', '93', 9),
  c('AL', 'Albania', '355', 9),
  c('DZ', 'Algeria', '213', 9),
  c('AR', 'Argentina', '54', 10),
  c('AM', 'Armenia', '374', 8),
  c('AU', 'Australia', '61', 9),
  c('AT', 'Austria', '43', 11),
  c('AZ', 'Azerbaijan', '994', 9),
  c('BH', 'Bahrain', '973', 8),
  c('BD', 'Bangladesh', '880', 10),
  c('BY', 'Belarus', '375', 9),
  c('BE', 'Belgium', '32', 9),
  c('BZ', 'Belize', '501', 7),
  c('BJ', 'Benin', '229', 8),
  c('BT', 'Bhutan', '975', 8),
  c('BO', 'Bolivia', '591', 8),
  c('BA', 'Bosnia and Herzegovina', '387', 8),
  c('BW', 'Botswana', '267', 8),
  c('BR', 'Brazil', '55', 11),
  c('BN', 'Brunei', '673', 7),
  c('BG', 'Bulgaria', '359', 9),
  c('KH', 'Cambodia', '855', 9),
  c('CM', 'Cameroon', '237', 9),
  c('CA', 'Canada', '1', 10),
  c('CL', 'Chile', '56', 9),
  c('CN', 'China', '86', 11),
  c('CO', 'Colombia', '57', 10),
  c('CR', 'Costa Rica', '506', 8),
  c('HR', 'Croatia', '385', 9),
  c('CU', 'Cuba', '53', 8),
  c('CY', 'Cyprus', '357', 8),
  c('CZ', 'Czech Republic', '420', 9),
  c('DK', 'Denmark', '45', 8),
  c('DO', 'Dominican Republic', '1', 10),
  c('EC', 'Ecuador', '593', 9),
  c('EG', 'Egypt', '20', 10),
  c('SV', 'El Salvador', '503', 8),
  c('EE', 'Estonia', '372', 8),
  c('ET', 'Ethiopia', '251', 9),
  c('FI', 'Finland', '358', 10),
  c('FR', 'France', '33', 9),
  c('GE', 'Georgia', '995', 9),
  c('DE', 'Germany', '49', 11),
  c('GH', 'Ghana', '233', 9),
  c('GR', 'Greece', '30', 10),
  c('GT', 'Guatemala', '502', 8),
  c('HN', 'Honduras', '504', 8),
  c('HK', 'Hong Kong', '852', 8),
  c('HU', 'Hungary', '36', 9),
  c('IS', 'Iceland', '354', 7),
  c('IN', 'India', '91', 10),
  c('ID', 'Indonesia', '62', 11),
  c('IR', 'Iran', '98', 10),
  c('IQ', 'Iraq', '964', 10),
  c('IE', 'Ireland', '353', 9),
  c('IL', 'Israel', '972', 9),
  c('IT', 'Italy', '39', 10),
  c('JM', 'Jamaica', '1', 10),
  c('JP', 'Japan', '81', 10),
  c('JO', 'Jordan', '962', 9),
  c('KZ', 'Kazakhstan', '7', 10),
  c('KE', 'Kenya', '254', 9),
  c('KW', 'Kuwait', '965', 8),
  c('KG', 'Kyrgyzstan', '996', 9),
  c('LA', 'Laos', '856', 10),
  c('LV', 'Latvia', '371', 8),
  c('LB', 'Lebanon', '961', 8),
  c('LY', 'Libya', '218', 9),
  c('LT', 'Lithuania', '370', 8),
  c('LU', 'Luxembourg', '352', 9),
  c('MO', 'Macau', '853', 8),
  c('MG', 'Madagascar', '261', 9),
  c('MY', 'Malaysia', '60', 10),
  c('MV', 'Maldives', '960', 7),
  c('MT', 'Malta', '356', 8),
  c('MX', 'Mexico', '52', 10),
  c('MD', 'Moldova', '373', 8),
  c('MN', 'Mongolia', '976', 8),
  c('ME', 'Montenegro', '382', 8),
  c('MA', 'Morocco', '212', 9),
  c('MZ', 'Mozambique', '258', 9),
  c('MM', 'Myanmar', '95', 9),
  c('NP', 'Nepal', '977', 10),
  c('NL', 'Netherlands', '31', 9),
  c('NZ', 'New Zealand', '64', 9),
  c('NI', 'Nicaragua', '505', 8),
  c('NG', 'Nigeria', '234', 10),
  c('MK', 'North Macedonia', '389', 8),
  c('NO', 'Norway', '47', 8),
  c('OM', 'Oman', '968', 8),
  c('PK', 'Pakistan', '92', 10),
  c('PA', 'Panama', '507', 8),
  c('PY', 'Paraguay', '595', 9),
  c('PE', 'Peru', '51', 9),
  c('PH', 'Philippines', '63', 10),
  c('PL', 'Poland', '48', 9),
  c('PT', 'Portugal', '351', 9),
  c('PR', 'Puerto Rico', '1', 10),
  c('QA', 'Qatar', '974', 8),
  c('RO', 'Romania', '40', 10),
  c('RU', 'Russia', '7', 10),
  c('RW', 'Rwanda', '250', 9),
  c('SA', 'Saudi Arabia', '966', 9),
  c('SN', 'Senegal', '221', 9),
  c('RS', 'Serbia', '381', 9),
  c('SG', 'Singapore', '65', 8),
  c('SK', 'Slovakia', '421', 9),
  c('SI', 'Slovenia', '386', 8),
  c('ZA', 'South Africa', '27', 9),
  c('KR', 'South Korea', '82', 10),
  c('ES', 'Spain', '34', 9),
  c('LK', 'Sri Lanka', '94', 9),
  c('SE', 'Sweden', '46', 9),
  c('CH', 'Switzerland', '41', 9),
  c('TW', 'Taiwan', '886', 9),
  c('TZ', 'Tanzania', '255', 9),
  c('TH', 'Thailand', '66', 9),
  c('TT', 'Trinidad and Tobago', '1', 10),
  c('TN', 'Tunisia', '216', 8),
  c('TR', 'Turkey', '90', 10),
  c('UG', 'Uganda', '256', 9),
  c('UA', 'Ukraine', '380', 9),
  c('AE', 'United Arab Emirates', '971', 9),
  c('GB', 'United Kingdom', '44', 10),
  c('US', 'United States', '1', 10),
  c('UY', 'Uruguay', '598', 8),
  c('UZ', 'Uzbekistan', '998', 9),
  c('VE', 'Venezuela', '58', 10),
  c('VN', 'Vietnam', '84', 10),
  c('YE', 'Yemen', '967', 9),
  c('ZM', 'Zambia', '260', 9),
  c('ZW', 'Zimbabwe', '263', 9),
];

export const DEFAULT_COUNTRY =
  COUNTRIES.find((country) => country.iso2 === 'US') ?? COUNTRIES[0];
