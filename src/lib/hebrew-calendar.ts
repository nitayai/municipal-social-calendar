/**
 * Hebrew calendar utilities using the built-in Intl API.
 * No external libraries required.
 */

export interface HebrewDateInfo {
  /** Display string, e.g. "ט״ו בשבט" */
  display: string;
  /** Hebrew month name (English, for matching) */
  month: string;
  /** Day number in Hebrew month */
  day: number;
  /** Holiday name if any */
  holiday: string | null;
  /** Is Shabbat (Saturday) */
  isShabbat: boolean;
}

// ---------------------------------------------------------------------------
// Intl-based Hebrew date extraction
// ---------------------------------------------------------------------------

const enHebrewFmt = new Intl.DateTimeFormat("en-u-ca-hebrew", {
  day: "numeric",
  month: "long",
});

const heHebrewFmt = new Intl.DateTimeFormat("he-u-ca-hebrew", {
  day: "numeric",
  month: "long",
});

function getHebrewParts(date: Date): { day: number; month: string } {
  const parts = enHebrewFmt.formatToParts(date);
  const dayStr = parts.find((p) => p.type === "day")?.value ?? "0";
  const monthStr = parts.find((p) => p.type === "month")?.value ?? "";
  return { day: parseInt(dayStr, 10), month: normalizeMonth(monthStr) };
}

function getHebrewDisplay(date: Date): string {
  return heHebrewFmt.format(date);
}

// ---------------------------------------------------------------------------
// Month name normalisation – different engines may spell slightly differently
// ---------------------------------------------------------------------------

function normalizeMonth(raw: string): string {
  const m = raw.toLowerCase().trim();
  if (m.startsWith("tishr")) return "Tishri";
  if (m.startsWith("heshv") || m.startsWith("cheshv") || m.startsWith("march"))
    return "Heshvan";
  if (m.startsWith("kisl")) return "Kislev";
  if (m.startsWith("tev")) return "Tevet";
  if (m.startsWith("shev") || m.startsWith("shv")) return "Shevat";
  // Adar variants – check II / 2 / B first
  if (m.includes("adar")) {
    if (/ii|2|ב|b\b/.test(m)) return "AdarII";
    if (/\bi\b|1|א|a\b/.test(m)) return "AdarI";
    return "Adar";
  }
  if (m.startsWith("nis")) return "Nisan";
  if (m.startsWith("iy")) return "Iyar";
  if (m.startsWith("siv") || m.startsWith("siw")) return "Sivan";
  if (m.startsWith("tam")) return "Tamuz";
  if (m === "av" || m.startsWith("av")) return "Av";
  if (m.startsWith("el")) return "Elul";
  return raw; // fallback
}

// ---------------------------------------------------------------------------
// Jewish holidays map  (Hebrew-month → day → name)
// ---------------------------------------------------------------------------

const HOLIDAYS: Record<string, Record<number, string>> = {
  Tishri: {
    1: "ראש השנה א׳",
    2: "ראש השנה ב׳",
    9: "ערב יום כיפור",
    10: "יום כיפור",
    14: "ערב סוכות",
    15: "סוכות",
    16: "סוכות ב׳",
    17: "חול המועד סוכות",
    18: "חול המועד סוכות",
    19: "חול המועד סוכות",
    20: "חול המועד סוכות",
    21: "הושענא רבה",
    22: "שמיני עצרת / שמחת תורה",
  },
  Kislev: {
    25: "חנוכה",
    26: "חנוכה",
    27: "חנוכה",
    28: "חנוכה",
    29: "חנוכה",
    30: "חנוכה",
  },
  Tevet: {
    1: "חנוכה",
    2: "חנוכה",
    3: "חנוכה", // 8th candle in short-Kislev years
    10: "צום עשרה בטבת",
  },
  Shevat: {
    15: 'ט"ו בשבט',
  },
  Adar: {
    13: "תענית אסתר",
    14: "פורים",
    15: "שושן פורים",
  },
  AdarII: {
    13: "תענית אסתר",
    14: "פורים",
    15: "שושן פורים",
  },
  AdarI: {
    14: "פורים קטן",
  },
  Nisan: {
    14: "ערב פסח",
    15: "פסח",
    16: "פסח ב׳",
    17: "חול המועד פסח",
    18: "חול המועד פסח",
    19: "חול המועד פסח",
    20: "חול המועד פסח",
    21: "שביעי של פסח",
    27: "יום השואה",
  },
  Iyar: {
    4: "יום הזיכרון",
    5: "יום העצמאות",
    18: 'ל"ג בעומר',
    28: "יום ירושלים",
  },
  Sivan: {
    5: "ערב שבועות",
    6: "שבועות",
  },
  Tamuz: {
    17: 'צום י"ז בתמוז',
  },
  Av: {
    9: "תשעה באב",
    15: 'ט"ו באב',
  },
};

function getHoliday(month: string, day: number): string | null {
  return HOLIDAYS[month]?.[day] ?? null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get full Hebrew date info for a Gregorian date.
 */
export function getHebrewDateInfo(date: Date): HebrewDateInfo {
  const { day, month } = getHebrewParts(date);
  const display = getHebrewDisplay(date);
  const holiday = getHoliday(month, day);
  const isShabbat = date.getDay() === 6;
  return { display, month, day, holiday, isShabbat };
}

/**
 * Batch-compute Hebrew info for every date string in the list.
 * Returns a Map keyed by "YYYY-MM-DD".
 */
export function getHebrewInfoForDates(
  dateStrings: string[]
): Map<string, HebrewDateInfo> {
  const map = new Map<string, HebrewDateInfo>();
  for (const ds of dateStrings) {
    // Parse as local date (avoid timezone shift)
    const [y, m, d] = ds.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    map.set(ds, getHebrewDateInfo(date));
  }
  return map;
}
