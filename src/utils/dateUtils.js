/**
 * Date and time helper functions for CareQueue Clinic Management
 */

/**
 * Returns today's local date as 'YYYY-MM-DD'
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if target date string ('YYYY-MM-DD') is strictly before today
 */
export function isPastDate(targetDateString) {
  if (!targetDateString) return false;
  const today = getTodayDateString();
  return targetDateString < today;
}

/**
 * Parses time string (e.g. "09:00 AM", "02:30 PM", "14:30") to minutes from midnight
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const str = timeStr.trim();
  const is12Hour = /am|pm/i.test(str);
  if (is12Hour) {
    const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } else {
    const match = str.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }
}

/**
 * Checks if target date and time slot has already passed relative to now
 */
export function isPastSlot(targetDateString, timeStr) {
  if (!targetDateString) return false;
  const today = getTodayDateString();
  if (targetDateString < today) return true;
  if (targetDateString > today) return false;

  // If date is today, check if time has passed
  if (!timeStr) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = parseTimeToMinutes(timeStr);
  return slotMinutes <= currentMinutes;
}

/**
 * Formats a Date object or minutes from midnight to "hh:mm AM/PM"
 */
export function formatTime12(dateOrMinutes = new Date()) {
  let h, m;
  if (typeof dateOrMinutes === 'number') {
    h = Math.floor(dateOrMinutes / 60);
    m = dateOrMinutes % 60;
  } else {
    h = dateOrMinutes.getHours();
    m = dateOrMinutes.getMinutes();
  }
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Formats a YYYY-MM-DD string to a readable format e.g. "Mon, 29 Sep 2026"
 */
export function formatReadableDate(dateString) {
  if (!dateString) return '—';
  const [year, month, day] = dateString.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dateObj);
}
