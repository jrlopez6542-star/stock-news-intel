/** Heurísticas ligeras de idioma para titulares/resúmenes. */

const SPANISH_MARKERS =
  /\b(el|la|los|las|de|del|un|una|por|para|con|sobre|según|tras|ante|hacia|desde|también|después|empresa|mercado|acciones|bolsa|economía|inflación|tasa|crecimiento|caída|sube|baja|millones|millones|anuncia|inversión)\b/i;

const ENGLISH_MARKERS =
  /\b(the|and|for|with|from|that|this|will|stock|shares|company|market|says|after|before|billion|million|earnings|revenue|raises|cuts|fed|tariff)\b/i;

export function looksLikeSpanish(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/[áéíóúñü¿¡]/i.test(t)) return true;
  const es = (t.match(SPANISH_MARKERS) || []).length;
  const en = (t.match(ENGLISH_MARKERS) || []).length;
  return es >= en && es > 0;
}

export function looksLikeEnglish(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (looksLikeSpanish(t)) return false;
  return ENGLISH_MARKERS.test(t) || /^[A-Za-z0-9\s.,:;'"!?()\-/&%$]+$/.test(t);
}
