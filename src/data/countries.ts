/**
 * ISO 3166-1 alpha-2 Country Dataset for Alimentari
 * Contains country codes, English names, and Italian localized names.
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2 e.g. "IT", "US", "FR"
  nameEn: string; // e.g. "Italy"
  nameIt: string; // e.g. "Italia"
}

export const COUNTRIES: Country[] = [
  { code: "IT", nameEn: "Italy", nameIt: "Italia" },
  { code: "AF", nameEn: "Afghanistan", nameIt: "Afghanistan" },
  { code: "AL", nameEn: "Albania", nameIt: "Albania" },
  { code: "DZ", nameEn: "Algeria", nameIt: "Algeria" },
  { code: "AD", nameEn: "Andorra", nameIt: "Andorra" },
  { code: "AO", nameEn: "Angola", nameIt: "Angola" },
  { code: "AR", nameEn: "Argentina", nameIt: "Argentina" },
  { code: "AM", nameEn: "Armenia", nameIt: "Armenia" },
  { code: "AU", nameEn: "Australia", nameIt: "Australia" },
  { code: "AT", nameEn: "Austria", nameIt: "Austria" },
  { code: "AZ", nameEn: "Azerbaijan", nameIt: "Azerbaigian" },
  { code: "BS", nameEn: "Bahamas", nameIt: "Bahamas" },
  { code: "BH", nameEn: "Bahrain", nameIt: "Bahrein" },
  { code: "BD", nameEn: "Bangladesh", nameIt: "Bangladesh" },
  { code: "BB", nameEn: "Barbados", nameIt: "Barbados" },
  { code: "BY", nameEn: "Belarus", nameIt: "Bielorussia" },
  { code: "BE", nameEn: "Belgium", nameIt: "Belgio" },
  { code: "BZ", nameEn: "Belize", nameIt: "Belize" },
  { code: "BJ", nameEn: "Benin", nameIt: "Benin" },
  { code: "BT", nameEn: "Bhutan", nameIt: "Bhutan" },
  { code: "BO", nameEn: "Bolivia", nameIt: "Bolivia" },
  { code: "BA", nameEn: "Bosnia and Herzegovina", nameIt: "Bosnia ed Erzegovina" },
  { code: "BW", nameEn: "Botswana", nameIt: "Botswana" },
  { code: "BR", nameEn: "Brazil", nameIt: "Brasile" },
  { code: "BN", nameEn: "Brunei", nameIt: "Brunei" },
  { code: "BG", nameEn: "Bulgaria", nameIt: "Bulgaria" },
  { code: "BF", nameEn: "Burkina Faso", nameIt: "Burkina Faso" },
  { code: "BI", nameEn: "Burundi", nameIt: "Burundi" },
  { code: "KH", nameEn: "Cambodia", nameIt: "Cambogia" },
  { code: "CM", nameEn: "Cameroon", nameIt: "Camerun" },
  { code: "CA", nameEn: "Canada", nameIt: "Canada" },
  { code: "CV", nameEn: "Cape Verde", nameIt: "Capo Verde" },
  { code: "CL", nameEn: "Chile", nameIt: "Cile" },
  { code: "CN", nameEn: "China", nameIt: "Cina" },
  { code: "CO", nameEn: "Colombia", nameIt: "Colombia" },
  { code: "KM", nameEn: "Comoros", nameIt: "Comore" },
  { code: "CG", nameEn: "Congo", nameIt: "Congo" },
  { code: "CR", nameEn: "Costa Rica", nameIt: "Costa Rica" },
  { code: "HR", nameEn: "Croatia", nameIt: "Croazia" },
  { code: "CU", nameEn: "Cuba", nameIt: "Cuba" },
  { code: "CY", nameEn: "Cyprus", nameIt: "Cipro" },
  { code: "CZ", nameEn: "Czech Republic", nameIt: "Repubblica Ceca" },
  { code: "DK", nameEn: "Denmark", nameIt: "Danimarca" },
  { code: "DJ", nameEn: "Djibouti", nameIt: "Gibuti" },
  { code: "DM", nameEn: "Dominica", nameIt: "Dominica" },
  { code: "DO", nameEn: "Dominican Republic", nameIt: "Repubblica Dominicana" },
  { code: "EC", nameEn: "Ecuador", nameIt: "Ecuador" },
  { code: "EG", nameEn: "Egypt", nameIt: "Egitto" },
  { code: "SV", nameEn: "El Salvador", nameIt: "El Salvador" },
  { code: "GQ", nameEn: "Equatorial Guinea", nameIt: "Guinea Equatoriale" },
  { code: "ER", nameEn: "Eritrea", nameIt: "Eritrea" },
  { code: "EE", nameEn: "Estonia", nameIt: "Estonia" },
  { code: "ET", nameEn: "Ethiopia", nameIt: "Etiopia" },
  { code: "FJ", nameEn: "Fiji", nameIt: "Fiji" },
  { code: "FI", nameEn: "Finland", nameIt: "Finlandia" },
  { code: "FR", nameEn: "France", nameIt: "Francia" },
  { code: "GA", nameEn: "Gabon", nameIt: "Gabon" },
  { code: "GM", nameEn: "Gambia", nameIt: "Gambia" },
  { code: "GE", nameEn: "Georgia", nameIt: "Georgia" },
  { code: "DE", nameEn: "Germany", nameIt: "Germania" },
  { code: "GH", nameEn: "Ghana", nameIt: "Ghana" },
  { code: "GR", nameEn: "Greece", nameIt: "Grecia" },
  { code: "GD", nameEn: "Grenada", nameIt: "Grenada" },
  { code: "GT", nameEn: "Guatemala", nameIt: "Guatemala" },
  { code: "GN", nameEn: "Guinea", nameIt: "Guinea" },
  { code: "GW", nameEn: "Guinea-Bissau", nameIt: "Guinea-Bissau" },
  { code: "GY", nameEn: "Guyana", nameIt: "Guyana" },
  { code: "HT", nameEn: "Haiti", nameIt: "Haiti" },
  { code: "HN", nameEn: "Honduras", nameIt: "Honduras" },
  { code: "HU", nameEn: "Hungary", nameIt: "Ungheria" },
  { code: "IS", nameEn: "Iceland", nameIt: "Islanda" },
  { code: "IN", nameEn: "India", nameIt: "India" },
  { code: "ID", nameEn: "Indonesia", nameIt: "Indonesia" },
  { code: "IR", nameEn: "Iran", nameIt: "Iran" },
  { code: "IQ", nameEn: "Iraq", nameIt: "Iraq" },
  { code: "IE", nameEn: "Ireland", nameIt: "Irlanda" },
  { code: "IL", nameEn: "Israel", nameIt: "Israele" },
  { code: "JM", nameEn: "Jamaica", nameIt: "Giamaica" },
  { code: "JP", nameEn: "Japan", nameIt: "Giappone" },
  { code: "JO", nameEn: "Jordan", nameIt: "Giordania" },
  { code: "KZ", nameEn: "Kazakhstan", nameIt: "Kazakistan" },
  { code: "KE", nameEn: "Kenya", nameIt: "Kenya" },
  { code: "KI", nameEn: "Kiribati", nameIt: "Kiribati" },
  { code: "KW", nameEn: "Kuwait", nameIt: "Kuwait" },
  { code: "KG", nameEn: "Kyrgyzstan", nameIt: "Kirghizistan" },
  { code: "LA", nameEn: "Laos", nameIt: "Laos" },
  { code: "LV", nameEn: "Latvia", nameIt: "Lettonia" },
  { code: "LB", nameEn: "Lebanon", nameIt: "Libano" },
  { code: "LS", nameEn: "Lesotho", nameIt: "Lesotho" },
  { code: "LR", nameEn: "Liberia", nameIt: "Liberia" },
  { code: "LY", nameEn: "Libya", nameIt: "Libia" },
  { code: "LI", nameEn: "Liechtenstein", nameIt: "Liechtenstein" },
  { code: "LT", nameEn: "Lithuania", nameIt: "Lituania" },
  { code: "LU", nameEn: "Luxembourg", nameIt: "Lussemburgo" },
  { code: "MG", nameEn: "Madagascar", nameIt: "Madagascar" },
  { code: "MW", nameEn: "Malawi", nameIt: "Malawi" },
  { code: "MY", nameEn: "Malaysia", nameIt: "Malesia" },
  { code: "MV", nameEn: "Maldives", nameIt: "Maldive" },
  { code: "ML", nameEn: "Mali", nameIt: "Mali" },
  { code: "MT", nameEn: "Malta", nameIt: "Malta" },
  { code: "MH", nameEn: "Marshall Islands", nameIt: "Isole Marshall" },
  { code: "MR", nameEn: "Mauritania", nameIt: "Mauritania" },
  { code: "MU", nameEn: "Mauritius", nameIt: "Mauritius" },
  { code: "MX", nameEn: "Mexico", nameIt: "Messico" },
  { code: "FM", nameEn: "Micronesia", nameIt: "Micronesia" },
  { code: "MD", nameEn: "Moldova", nameIt: "Moldavia" },
  { code: "MC", nameEn: "Monaco", nameIt: "Principato di Monaco" },
  { code: "MN", nameEn: "Mongolia", nameIt: "Mongolia" },
  { code: "ME", nameEn: "Montenegro", nameIt: "Montenegro" },
  { code: "MA", nameEn: "Morocco", nameIt: "Marocco" },
  { code: "MZ", nameEn: "Mozambique", nameIt: "Mozambico" },
  { code: "MM", nameEn: "Myanmar", nameIt: "Myanmar" },
  { code: "NA", nameEn: "Namibia", nameIt: "Namibia" },
  { code: "NR", nameEn: "Nauru", nameIt: "Nauru" },
  { code: "NP", nameEn: "Nepal", nameIt: "Nepal" },
  { code: "NL", nameEn: "Netherlands", nameIt: "Paesi Bassi" },
  { code: "NZ", nameEn: "New Zealand", nameIt: "Nuova Zelanda" },
  { code: "NI", nameEn: "Nicaragua", nameIt: "Nicaragua" },
  { code: "NE", nameEn: "Niger", nameIt: "Niger" },
  { code: "NG", nameEn: "Nigeria", nameIt: "Nigeria" },
  { code: "KP", nameEn: "North Korea", nameIt: "Corea del Nord" },
  { code: "MK", nameEn: "North Macedonia", nameIt: "Macedonia del Nord" },
  { code: "NO", nameEn: "Norway", nameIt: "Norvegia" },
  { code: "OM", nameEn: "Oman", nameIt: "Oman" },
  { code: "PK", nameEn: "Pakistan", nameIt: "Pakistan" },
  { code: "PW", nameEn: "Palau", nameIt: "Palau" },
  { code: "PA", nameEn: "Panama", nameIt: "Panama" },
  { code: "PG", nameEn: "Papua New Guinea", nameIt: "Papua Nuova Guinea" },
  { code: "PY", nameEn: "Paraguay", nameIt: "Paraguay" },
  { code: "PE", nameEn: "Peru", nameIt: "Perù" },
  { code: "PH", nameEn: "Philippines", nameIt: "Filippine" },
  { code: "PL", nameEn: "Poland", nameIt: "Polonia" },
  { code: "PT", nameEn: "Portugal", nameIt: "Portogallo" },
  { code: "QA", nameEn: "Qatar", nameIt: "Qatar" },
  { code: "RO", nameEn: "Romania", nameIt: "Romania" },
  { code: "RU", nameEn: "Russia", nameIt: "Russia" },
  { code: "RW", nameEn: "Rwanda", nameIt: "Ruanda" },
  { code: "KN", nameEn: "Saint Kitts and Nevis", nameIt: "Saint Kitts e Nevis" },
  { code: "LC", nameEn: "Saint Lucia", nameIt: "Santa Lucia" },
  { code: "VC", nameEn: "Saint Vincent and the Grenadines", nameIt: "Saint Vincent e Grenadine" },
  { code: "WS", nameEn: "Samoa", nameIt: "Samoa" },
  { code: "SM", nameEn: "San Marino", nameIt: "San Marino" },
  { code: "ST", nameEn: "Sao Tome and Principe", nameIt: "Sao Tomé e Principe" },
  { code: "SA", nameEn: "Saudi Arabia", nameIt: "Arabia Saudita" },
  { code: "SN", nameEn: "Senegal", nameIt: "Senegal" },
  { code: "RS", nameEn: "Serbia", nameIt: "Serbia" },
  { code: "SC", nameEn: "Seychelles", nameIt: "Seychelles" },
  { code: "SL", nameEn: "Sierra Leone", nameIt: "Sierra Leone" },
  { code: "SG", nameEn: "Singapore", nameIt: "Singapore" },
  { code: "SK", nameEn: "Slovakia", nameIt: "Slovacchia" },
  { code: "SI", nameEn: "Slovenia", nameIt: "Slovenia" },
  { code: "SB", nameEn: "Solomon Islands", nameIt: "Isole Salomone" },
  { code: "SO", nameEn: "Somalia", nameIt: "Somalia" },
  { code: "ZA", nameEn: "South Africa", nameIt: "Sudafrica" },
  { code: "KR", nameEn: "South Korea", nameIt: "Corea del Sud" },
  { code: "SS", nameEn: "South Sudan", nameIt: "Sud Sudan" },
  { code: "ES", nameEn: "Spain", nameIt: "Spagna" },
  { code: "LK", nameEn: "Sri Lanka", nameIt: "Sri Lanka" },
  { code: "SD", nameEn: "Sudan", nameIt: "Sudan" },
  { code: "SR", nameEn: "Suriname", nameIt: "Suriname" },
  { code: "SE", nameEn: "Sweden", nameIt: "Svezia" },
  { code: "CH", nameEn: "Switzerland", nameIt: "Svizzera" },
  { code: "SY", nameEn: "Syria", nameIt: "Siria" },
  { code: "TW", nameEn: "Taiwan", nameIt: "Taiwan" },
  { code: "TJ", nameEn: "Tajikistan", nameIt: "Tagikistan" },
  { code: "TZ", nameEn: "Tanzania", nameIt: "Tanzania" },
  { code: "TH", nameEn: "Thailand", nameIt: "Thailandia" },
  { code: "TL", nameEn: "Timor-Leste", nameIt: "Timor Est" },
  { code: "TG", nameEn: "Togo", nameIt: "Togo" },
  { code: "TO", nameEn: "Tonga", nameIt: "Tonga" },
  { code: "TT", nameEn: "Trinidad and Tobago", nameIt: "Trinidad e Tobago" },
  { code: "TN", nameEn: "Tunisia", nameIt: "Tunisia" },
  { code: "TR", nameEn: "Turkey", nameIt: "Turchia" },
  { code: "TM", nameEn: "Turkmenistan", nameIt: "Turkmenistan" },
  { code: "TV", nameEn: "Tuvalu", nameIt: "Tuvalu" },
  { code: "UG", nameEn: "Uganda", nameIt: "Uganda" },
  { code: "UA", nameEn: "Ukraine", nameIt: "Ucraina" },
  { code: "AE", nameEn: "United Arab Emirates", nameIt: "Emirati Arabi Uniti" },
  { code: "GB", nameEn: "United Kingdom", nameIt: "Regno Unito" },
  { code: "US", nameEn: "United States", nameIt: "Stati Uniti" },
  { code: "UY", nameEn: "Uruguay", nameIt: "Uruguay" },
  { code: "UZ", nameEn: "Uzbekistan", nameIt: "Uzbekistan" },
  { code: "VU", nameEn: "Vanuatu", nameIt: "Vanuatu" },
  { code: "VA", nameEn: "Vatican City", nameIt: "Città del Vaticano" },
  { code: "VE", nameEn: "Venezuela", nameIt: "Venezuela" },
  { code: "VN", nameEn: "Vietnam", nameIt: "Vietnam" },
  { code: "YE", nameEn: "Yemen", nameIt: "Yemen" },
  { code: "ZM", nameEn: "Zambia", nameIt: "Zambia" },
  { code: "ZW", nameEn: "Zimbabwe", nameIt: "Zimbabwe" }
];

/**
 * Returns all countries sorted alphabetically according to the active locale ("it" | "en").
 */
export function getCountries(locale: "it" | "en" = "it"): Country[] {
  return [...COUNTRIES].sort((a, b) => {
    const nameA = locale === "it" ? a.nameIt : a.nameEn;
    const nameB = locale === "it" ? b.nameIt : b.nameEn;
    return nameA.localeCompare(nameB);
  });
}

/**
 * Looks up a Country object by its 2-letter ISO code.
 */
export function getCountryByCode(code: string | undefined | null): Country | undefined {
  if (!code) return undefined;
  const clean = code.trim().toUpperCase();
  return COUNTRIES.find((c) => c.code === clean);
}

/**
 * Returns the canonical English country name expected by Shopify Storefront API (e.g., "Italy" for "IT").
 */
export function getCountryNameForShopify(codeOrName: string | undefined | null): string {
  if (!codeOrName) return "Italy";
  const normalizedCode = normalizeCountryToCode(codeOrName);
  const country = getCountryByCode(normalizedCode);
  return country ? country.nameEn : "Italy";
}

/**
 * Normalizes any country string (e.g. "Italy", "Italia", "IT", "it", "italy", "italia") to its ISO 2-letter code ("IT").
 */
export function normalizeCountryToCode(countryInput: string | undefined | null): string {
  if (!countryInput) return "IT";
  const clean = countryInput.trim().toLowerCase();

  if (clean === "it" || clean === "italy" || clean === "italia") {
    return "IT";
  }

  // Check direct ISO code match
  const byCode = COUNTRIES.find((c) => c.code.toLowerCase() === clean);
  if (byCode) return byCode.code;

  // Check English name match
  const byEn = COUNTRIES.find((c) => c.nameEn.toLowerCase() === clean);
  if (byEn) return byEn.code;

  // Check Italian name match
  const byIt = COUNTRIES.find((c) => c.nameIt.toLowerCase() === clean);
  if (byIt) return byIt.code;

  // Partial match fallback
  const partial = COUNTRIES.find(
    (c) => c.nameEn.toLowerCase().includes(clean) || c.nameIt.toLowerCase().includes(clean)
  );
  if (partial) return partial.code;

  return "IT";
}
