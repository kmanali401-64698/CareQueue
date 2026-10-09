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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 'Mon', 'Tue', ... for a YYYY-MM-DD date (local calendar). */
export function dayNameOf(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return DAY_NAMES[new Date(year, month - 1, day).getDay()];
}

/** Minutes since midnight for "09:30 AM", "02:15 PM" or "14:15"; null if unparseable. */
export function parseTimeToMinutes(timeStr) {
  const str = String(timeStr || '').trim();
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (minutes > 59 || hours > (meridiem ? 12 : 23)) return null;
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/** Minutes since midnight right now (local time). */
export function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}
