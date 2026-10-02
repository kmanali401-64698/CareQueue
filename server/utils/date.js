/**
 * Local calendar date as YYYY-MM-DD (avoids the UTC shift of toISOString()).
 */
export function toISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's local date as YYYY-MM-DD. */
export function todayISO() {
  return toISODate(new Date());
}

/** Local date `offsetDays` from today as YYYY-MM-DD. */
export function dateFromToday(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toISODate(d);
}
