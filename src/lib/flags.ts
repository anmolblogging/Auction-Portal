// Country name → flag emoji.
//
// Covers every nation in the WC2026 squad uploads plus the common football
// countries that show up in ESPN fixtures. Anything unknown falls back to the
// globe so callers never render an empty string.

// England / Scotland / Wales have no ISO alpha-2 flag — they use the special
// subdivision flag emojis (tag sequences), so we map them directly.
const SPECIAL: Record<string, string> = {
  england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
};

// Lowercased country name (and common aliases) → ISO 3166-1 alpha-2 code.
const NAME_TO_ISO: Record<string, string> = {
  // WC2026 squad upload nations
  algeria: 'DZ', argentina: 'AR', austria: 'AT', belgium: 'BE',
  'bosnia and herzegovina': 'BA', brazil: 'BR', canada: 'CA', colombia: 'CO',
  croatia: 'HR', czechia: 'CZ', 'czech republic': 'CZ', 'dr congo': 'CD',
  'democratic republic of congo': 'CD', 'congo dr': 'CD', ecuador: 'EC',
  egypt: 'EG', france: 'FR', germany: 'DE', ghana: 'GH', greece: 'GR',
  iran: 'IR', 'ivory coast': 'CI', "cote d'ivoire": 'CI', 'côte d’ivoire': 'CI',
  japan: 'JP', mexico: 'MX', morocco: 'MA', netherlands: 'NL',
  'new zealand': 'NZ', norway: 'NO', paraguay: 'PY', portugal: 'PT',
  senegal: 'SN', 'south korea': 'KR', 'korea republic': 'KR', spain: 'ES',
  sweden: 'SE', switzerland: 'CH', turkiye: 'TR', türkiye: 'TR', turkey: 'TR',
  uruguay: 'UY', usa: 'US', 'united states': 'US',

  // other common football nations (fixtures / future uploads)
  australia: 'AU', 'saudi arabia': 'SA', qatar: 'QA', tunisia: 'TN',
  'south africa': 'ZA', nigeria: 'NG', cameroon: 'CM', mali: 'ML',
  'cape verde': 'CV', uzbekistan: 'UZ', jordan: 'JO', 'south sudan': 'SS',
  panama: 'PA', 'costa rica': 'CR', honduras: 'HN', jamaica: 'JM',
  'el salvador': 'SV', haiti: 'HT', 'curacao': 'CW', 'curaçao': 'CW',
  peru: 'PE', chile: 'CL', bolivia: 'BO', venezuela: 'VE', poland: 'PL',
  denmark: 'DK', italy: 'IT', serbia: 'RS', ukraine: 'UA', hungary: 'HU',
  romania: 'RO', 'republic of ireland': 'IE', ireland: 'IE', slovakia: 'SK',
  slovenia: 'SI', albania: 'AL', finland: 'FI', iceland: 'IS',
  'north macedonia': 'MK', india: 'IN', china: 'CN', 'north korea': 'KP',
  'united arab emirates': 'AE', uae: 'AE', iraq: 'IQ', oman: 'OM',
  bahrain: 'BH', kuwait: 'KW', palestine: 'PS', lebanon: 'LB', syria: 'SY',
  thailand: 'TH', vietnam: 'VN', indonesia: 'ID', malaysia: 'MY',
  'trinidad and tobago': 'TT', guatemala: 'GT', suriname: 'SR', guyana: 'GY',
  angola: 'AO', zambia: 'ZM', kenya: 'KE', uganda: 'UG', 'burkina faso': 'BF',
  guinea: 'GN', 'equatorial guinea': 'GQ', gabon: 'GA', mozambique: 'MZ',
  mauritania: 'MR', namibia: 'NA', benin: 'BJ', togo: 'TG', libya: 'LY',
  georgia: 'GE', kazakhstan: 'KZ', kyrgyzstan: 'KG', tajikistan: 'TJ',
  turkmenistan: 'TM', montenegro: 'ME', kosovo: 'XK', israel: 'IL',
  bulgaria: 'BG', luxembourg: 'LU', cyprus: 'CY', estonia: 'EE',
  latvia: 'LV', lithuania: 'LT',
};

function isoToFlag(iso: string): string {
  if (!iso || iso.length !== 2) return '';
  const A = 0x1f1e6; // regional indicator 'A'
  const cc = iso.toUpperCase();
  return String.fromCodePoint(
    A + (cc.charCodeAt(0) - 65),
    A + (cc.charCodeAt(1) - 65)
  );
}

/** Flag emoji for a country name, or 🌍 when it can't be resolved. */
export function countryFlag(country?: string | null): string {
  if (!country) return '🌍';
  const key = country.trim().toLowerCase();
  if (SPECIAL[key]) return SPECIAL[key];
  return isoToFlag(NAME_TO_ISO[key] || '') || '🌍';
}

/**
 * Flag for a player: keeps any real flag already on `nat`, otherwise derives
 * one from the country. Treats the generic globe (or empty) as "no flag yet".
 */
export function playerFlag(p: { nat?: string; country?: string | null }): string {
  const nat = (p.nat || '').trim();
  if (nat && nat !== '🌍') return nat;
  return countryFlag(p.country);
}
