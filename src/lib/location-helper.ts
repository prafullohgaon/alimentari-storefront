import { State, City } from "country-state-city";
import { getProvinces, findProvinceByNameOrCode, getCitiesForProvince } from "@/data/italy-locations";

export interface AdministrativeSubdivision {
  code: string;
  name: string;
  rawName: string;
}

/**
 * Returns list of all 20 Italian regions sorted alphabetically.
 */
export function getItalyRegions(): string[] {
  const regions = new Set<string>();
  getProvinces().forEach((p) => {
    if (p.region) regions.add(p.region);
  });
  return Array.from(regions).sort((a, b) => a.localeCompare(b, "it"));
}

/**
 * Returns provinces belonging to a specific Italian region.
 */
export function getItalyProvincesForRegion(regionName: string | undefined | null): AdministrativeSubdivision[] {
  if (!regionName) return [];
  const cleanRegion = regionName.trim().toLowerCase();
  const provinces = getProvinces().filter(
    (p) => p.region.toLowerCase() === cleanRegion || cleanRegion.includes(p.region.toLowerCase())
  );
  return provinces.map((p) => ({
    code: p.code,
    name: `${p.name} (${p.code})`,
    rawName: p.name,
  }));
}

/**
 * Resolves the region for a given province code or name.
 */
export function getRegionForProvince(provinceCodeOrName: string | undefined | null): string {
  if (!provinceCodeOrName) return "";
  const prov = findProvinceByNameOrCode(provinceCodeOrName);
  return prov ? prov.region : "";
}

/**
 * Returns country-specific terminology for administrative area label.
 * e.g., US -> State, IN -> State, DE -> State, FR -> Region, ID -> Province, IT -> Province
 */
export function getSubdivisionLabel(countryCode: string | undefined | null, locale: "it" | "en" = "it"): string {
  if (!countryCode) return locale === "it" ? "Stato / Provincia / Regione" : "State / Province / Region";
  const code = countryCode.toUpperCase();
  switch (code) {
    case "IT":
    case "ID":
    case "CA":
      return locale === "it" ? "Provincia" : "Province";
    case "US":
    case "IN":
    case "DE":
    case "AU":
    case "BR":
    case "MX":
      return locale === "it" ? "Stato" : "State";
    case "FR":
    case "ES":
      return locale === "it" ? "Regione" : "Region";
    default:
      return locale === "it" ? "Stato / Provincia / Regione" : "State / Province / Region";
  }
}

/**
 * Gets all administrative subdivisions for a country.
 * If regionFilter is provided for IT, filters provinces to that region.
 */
export function getSubdivisionsForCountry(
  countryCode: string | undefined | null,
  regionFilter?: string | undefined | null
): AdministrativeSubdivision[] {
  if (!countryCode) return [];
  const code = countryCode.toUpperCase();

  if (code === "IT") {
    if (regionFilter) {
      return getItalyProvincesForRegion(regionFilter);
    }
    return getProvinces().map((p) => ({
      code: p.code,
      name: `${p.name} (${p.code})`,
      rawName: p.name,
    }));
  }

  const states = State.getStatesOfCountry(code);
  return states.map((s) => ({
    code: s.isoCode,
    name: s.name,
    rawName: s.name,
  }));
}

/**
 * Gets all cities for a specific country and subdivision/state code or name.
 */
export function getCitiesForSubdivision(
  countryCode: string | undefined | null,
  subdivisionCodeOrName: string | undefined | null
): string[] {
  if (!countryCode || !subdivisionCodeOrName) return [];
  const code = countryCode.toUpperCase();

  if (code === "IT") {
    return getCitiesForProvince(subdivisionCodeOrName);
  }

  const states = State.getStatesOfCountry(code);
  const cleanSub = subdivisionCodeOrName.trim().toLowerCase();

  // 1. Exact isoCode match (e.g. "CA" for California)
  const exactCode = states.find((s) => s.isoCode.toLowerCase() === cleanSub);
  if (exactCode) {
    return Array.from(new Set(City.getCitiesOfState(code, exactCode.isoCode).map((c) => c.name))).sort((a, b) => a.localeCompare(b));
  }

  // 2. Exact name match (e.g. "California")
  const exactName = states.find((s) => s.name.toLowerCase() === cleanSub);
  if (exactName) {
    return Array.from(new Set(City.getCitiesOfState(code, exactName.isoCode).map((c) => c.name))).sort((a, b) => a.localeCompare(b));
  }

  // 3. Partial match as fallback
  const partialState = states.find(
    (s) =>
      cleanSub.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(cleanSub)
  );

  if (!partialState) return [];

  return Array.from(new Set(City.getCitiesOfState(code, partialState.isoCode).map((c) => c.name))).sort((a, b) => a.localeCompare(b));
}

/**
 * Matches a saved Shopify province/state string to a valid subdivision entry code/name.
 */
export function matchSavedSubdivision(
  countryCode: string | undefined | null,
  savedProvince: string | undefined | null
): string {
  if (!countryCode || !savedProvince) return "";
  const code = countryCode.toUpperCase();
  const clean = savedProvince.trim().toLowerCase();

  if (code === "IT") {
    const prov = findProvinceByNameOrCode(savedProvince);
    return prov ? prov.code : savedProvince;
  }

  const subdivisions = getSubdivisionsForCountry(code);
  if (subdivisions.length === 0) return savedProvince;

  const exactMatch = subdivisions.find(
    (s) =>
      s.code.toLowerCase() === clean ||
      s.rawName.toLowerCase() === clean ||
      s.name.toLowerCase() === clean
  );
  if (exactMatch) return exactMatch.code;

  const partialMatch = subdivisions.find(
    (s) =>
      clean.includes(s.rawName.toLowerCase()) ||
      s.rawName.toLowerCase().includes(clean)
  );
  if (partialMatch) return partialMatch.code;

  return savedProvince;
}

/**
 * Resolves canonical province/state name for sending to Shopify.
 */
export function getProvinceNameForShopify(
  countryCode: string | undefined | null,
  subdivisionCodeOrName: string | undefined | null
): string {
  if (!countryCode || !subdivisionCodeOrName) return "";
  const code = countryCode.toUpperCase();

  if (code === "IT") {
    const prov = findProvinceByNameOrCode(subdivisionCodeOrName);
    return prov ? prov.name : subdivisionCodeOrName;
  }

  const subdivisions = getSubdivisionsForCountry(code);
  const clean = subdivisionCodeOrName.trim().toLowerCase();

  const exactCode = subdivisions.find((s) => s.code.toLowerCase() === clean);
  if (exactCode) return exactCode.rawName;

  const exactName = subdivisions.find((s) => s.rawName.toLowerCase() === clean || s.name.toLowerCase() === clean);
  if (exactName) return exactName.rawName;

  const partial = subdivisions.find(
    (s) =>
      clean.includes(s.rawName.toLowerCase()) ||
      s.rawName.toLowerCase().includes(clean)
  );

  return partial ? partial.rawName : subdivisionCodeOrName;
}

// 2-digit CAP prefixes for all 110 Italian Provinces
const ITALY_PROVINCE_CAP_PREFIXES: Record<string, string[]> = {
  AG: ["92"],
  AL: ["15"],
  AN: ["60"],
  AO: ["11"],
  AP: ["63"],
  AQ: ["67"],
  AR: ["52"],
  AT: ["14"],
  AV: ["83"],
  BA: ["70"],
  BG: ["24"],
  BI: ["13"],
  BL: ["32"],
  BN: ["82"],
  BO: ["40"],
  BR: ["72"],
  BS: ["25"],
  BT: ["76"],
  BZ: ["39"],
  CA: ["09"],
  CB: ["86"],
  CE: ["81"],
  CH: ["66"],
  CL: ["93"],
  CN: ["12"],
  CO: ["22"],
  CR: ["26"],
  CS: ["87"],
  CT: ["95"],
  CZ: ["88"],
  EN: ["94"],
  FC: ["47"],
  FE: ["44"],
  FG: ["71"],
  FI: ["50"],
  FM: ["63"],
  FR: ["03"],
  GE: ["16"],
  GO: ["34"],
  GR: ["58"],
  IM: ["18"],
  IS: ["86"],
  KR: ["88"],
  LC: ["23"],
  LE: ["73"],
  LI: ["57"],
  LO: ["26"],
  LT: ["04"],
  LU: ["55"],
  MB: ["20"],
  MC: ["62"],
  ME: ["98"],
  MI: ["20"],
  MN: ["46"],
  MO: ["41"],
  MS: ["54"],
  MT: ["75"],
  NA: ["80"],
  NO: ["28"],
  NU: ["08"],
  OR: ["09"],
  PA: ["90"],
  PC: ["29"],
  PD: ["35"],
  PE: ["65"],
  PG: ["06"],
  PI: ["56"],
  PN: ["33"],
  PO: ["59"],
  PR: ["43"],
  PT: ["51"],
  PU: ["61"],
  PV: ["27"],
  PZ: ["85"],
  RA: ["48"],
  RC: ["89"],
  RG: ["97"],
  RI: ["02"],
  RM: ["00"],
  RN: ["47"],
  RO: ["45"],
  SA: ["84"],
  SI: ["53"],
  SO: ["23"],
  SP: ["19"],
  SR: ["96"],
  SS: ["07"],
  SU: ["09"],
  SV: ["17"],
  TA: ["74"],
  TE: ["64"],
  TN: ["38"],
  TO: ["10"],
  TP: ["91"],
  TR: ["05"],
  TS: ["34"],
  TV: ["31"],
  UD: ["33"],
  VA: ["21"],
  VB: ["28"],
  VC: ["13"],
  VE: ["30"],
  VI: ["36"],
  VR: ["37"],
  VT: ["01"],
  VV: ["89"],
};

/**
 * Validates Italian postal code (CAP) against selected province and municipality.
 */
export function validateItalianCap(
  zip: string,
  provinceCodeOrName: string,
  cityName?: string,
  locale: "it" | "en" = "it"
): { isValid: boolean; error?: string } {
  const cleanZip = zip.trim();
  if (!/^\d{5}$/.test(cleanZip)) {
    return {
      isValid: false,
      error: locale === "it" ? "Inserisci un CAP valido (5 cifre)" : "Enter a valid 5-digit postal code",
    };
  }

  const prov = findProvinceByNameOrCode(provinceCodeOrName);
  const provCode = prov ? prov.code : provinceCodeOrName.trim().toUpperCase();

  const validPrefixes = ITALY_PROVINCE_CAP_PREFIXES[provCode];
  if (validPrefixes) {
    const zipPrefix = cleanZip.substring(0, 2);
    if (!validPrefixes.includes(zipPrefix)) {
      const provName = prov ? `${prov.name} (${prov.code})` : provCode;
      const expectedPrefix = validPrefixes.join(" o ");
      return {
        isValid: false,
        error:
          locale === "it"
            ? `Il CAP ${cleanZip} non corrisponde alla provincia di ${provName}. I CAP di questa provincia iniziano con ${expectedPrefix}.`
            : `CAP ${cleanZip} does not match province ${provName}. CAPs for this province start with ${expectedPrefix}.`,
      };
    }
  }

  // City specific checks for major cities
  if (cityName && provCode === "NA") {
    const cleanCity = cityName.trim().toLowerCase();
    const numericCap = parseInt(cleanZip, 10);
    if (cleanCity === "napoli") {
      if (numericCap < 80121 || numericCap > 80147) {
        return {
          isValid: false,
          error:
            locale === "it"
              ? `Il CAP ${cleanZip} non è un CAP valido per il comune di Napoli (compreso tra 80121 e 80147).`
              : `CAP ${cleanZip} is not a valid CAP for the municipality of Napoli (between 80121 and 80147).`,
        };
      }
    } else {
      if (numericCap >= 80121 && numericCap <= 80147) {
        return {
          isValid: false,
          error:
            locale === "it"
              ? `Il CAP ${cleanZip} è riservato al comune di Napoli e non corrisponde a ${cityName}.`
              : `CAP ${cleanZip} is reserved for the municipality of Napoli and does not match ${cityName}.`,
        };
      }
    }
  } else if (cityName && provCode === "CE") {
    const cleanCity = cityName.trim().toLowerCase();
    if (cleanCity === "caserta" && cleanZip !== "81100") {
      return {
        isValid: false,
        error:
          locale === "it"
            ? `Il CAP per il comune di Caserta è 81100. ${cleanZip} non corrisponde.`
            : `The CAP for the municipality of Caserta is 81100. ${cleanZip} does not match.`,
      };
    }
  }

  return { isValid: true };
}
