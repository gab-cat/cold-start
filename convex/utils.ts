import {
  format,
  setHours,
  setMinutes,
  startOfDay,
  subDays,
  subHours,
  subMinutes,
  subWeeks,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

/**
 * Determines meal type based on timestamp and optional timezone
 * 
 * Time ranges:
 * - Breakfast: 5:00 AM - 10:59 AM
 * - Lunch: 11:00 AM - 1:59 PM
 * - Snack: 2:00 PM - 4:59 PM
 * - Dinner: 5:00 PM - 8:59 PM
 * - Late night snack: 9:00 PM - 4:59 AM
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @param timezone - Optional timezone (e.g., "Asia/Manila", "America/New_York")
 * @returns Meal type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
 */
export function getMealTypeFromTimestamp(
  timestamp: number,
  timezone?: string
): "breakfast" | "lunch" | "dinner" | "snack" {
  const date = new Date(timestamp);
  const zonedDate = timezone ? toZonedTime(date, timezone) : date;
  const hour = zonedDate.getHours();

  // Breakfast: 5 AM - 10:59 AM
  if (hour >= 5 && hour < 11) {
    return "breakfast";
  }

  // Lunch: 11 AM - 1:59 PM
  if (hour >= 11 && hour < 14) {
    return "lunch";
  }

  // Afternoon snack: 2 PM - 4:59 PM
  if (hour >= 14 && hour < 17) {
    return "snack";
  }

  // Dinner: 5 PM - 8:59 PM
  if (hour >= 17 && hour < 21) {
    return "dinner";
  }

  // Late night snack: 9 PM - 4:59 AM
  return "snack";
}

export function generateUniqueCode(length: number = 8): string {
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length)
    .toUpperCase();
}

/**
 * Get current time information for the agent context
 */
export function getCurrentTimeInfo(timezone?: string): {
  timestamp: number;
  isoString: string;
  localTime: string;
  dayOfWeek: string;
  hour: number;
  timezone: string;
} {
  const now = new Date();
  const tz = timezone || "UTC";
  const zonedTime = toZonedTime(now, tz);
  
  return {
    timestamp: now.getTime(),
    isoString: now.toISOString(),
    localTime: format(zonedTime, "yyyy-MM-dd HH:mm:ss"),
    dayOfWeek: format(zonedTime, "EEEE"),
    hour: zonedTime.getHours(),
    timezone: tz,
  };
}

/**
 * Parses relative time expressions like "an hour ago", "30 minutes ago", "yesterday"
 * 
 * @param timeString - Relative time string to parse
 * @param referenceDate - Reference date (defaults to now)
 * @param timezone - Optional timezone for calculations
 * @returns Timestamp in milliseconds, or null if not a relative time expression
 */
export function parseRelativeTime(
  timeString: string,
  referenceDate?: Date,
  timezone?: string
): number | null {
  if (!timeString || typeof timeString !== "string") {
    return null;
  }

  const normalized = timeString.trim().toLowerCase();
  const now = referenceDate || new Date();
  
  // "just now", "just finished", "right now"
  if (/^(just now|just finished|right now|now)$/.test(normalized)) {
    return now.getTime();
  }

  // "X minutes ago" or "X mins ago"
  const minutesAgoMatch = normalized.match(/^(\d+)\s*(minutes?|mins?)\s*ago$/);
  if (minutesAgoMatch) {
    const minutes = parseInt(minutesAgoMatch[1], 10);
    return subMinutes(now, minutes).getTime();
  }

  // "an hour ago" or "1 hour ago" or "X hours ago"
  const hoursAgoMatch = normalized.match(/^(an?|\d+)\s*hours?\s*ago$/);
  if (hoursAgoMatch) {
    const hours = hoursAgoMatch[1] === "a" || hoursAgoMatch[1] === "an" ? 1 : parseInt(hoursAgoMatch[1], 10);
    return subHours(now, hours).getTime();
  }

  // "half an hour ago" or "30 mins ago"
  if (/^half\s*an?\s*hour\s*ago$/.test(normalized)) {
    return subMinutes(now, 30).getTime();
  }

  // "yesterday" - sets to same time yesterday
  if (normalized === "yesterday") {
    return subDays(now, 1).getTime();
  }

  // "yesterday at X" or "yesterday Xpm/am"
  const yesterdayAtMatch = normalized.match(/^yesterday\s*(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (yesterdayAtMatch) {
    const yesterday = subDays(startOfDay(now), 1);
    let hours = parseInt(yesterdayAtMatch[1], 10);
    const minutes = yesterdayAtMatch[2] ? parseInt(yesterdayAtMatch[2], 10) : 0;
    const period = yesterdayAtMatch[3];
    
    if (period === "pm" && hours !== 12) hours += 12;
    else if (period === "am" && hours === 12) hours = 0;
    
    return setMinutes(setHours(yesterday, hours), minutes).getTime();
  }

  // "X days ago"
  const daysAgoMatch = normalized.match(/^(\d+)\s*days?\s*ago$/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    return subDays(now, days).getTime();
  }

  // "last week"
  if (normalized === "last week") {
    return subWeeks(now, 1).getTime();
  }

  // "this morning" - approximate to 7:00 AM today in user's timezone
  if (normalized === "this morning") {
    if (timezone) {
      const zonedNow = toZonedTime(now, timezone);
      const zonedMorning = setHours(startOfDay(zonedNow), 7);
      return fromZonedTime(zonedMorning, timezone).getTime();
    }
    const today = startOfDay(now);
    return setHours(today, 7).getTime();
  }

  // "this afternoon" - approximate to 2:00 PM today in user's timezone
  if (normalized === "this afternoon") {
    if (timezone) {
      const zonedNow = toZonedTime(now, timezone);
      const zonedAfternoon = setHours(startOfDay(zonedNow), 14);
      return fromZonedTime(zonedAfternoon, timezone).getTime();
    }
    const today = startOfDay(now);
    return setHours(today, 14).getTime();
  }

  // "this evening" - approximate to 6:00 PM today in user's timezone
  if (normalized === "this evening") {
    if (timezone) {
      const zonedNow = toZonedTime(now, timezone);
      const zonedEvening = setHours(startOfDay(zonedNow), 18);
      return fromZonedTime(zonedEvening, timezone).getTime();
    }
    const today = startOfDay(now);
    return setHours(today, 18).getTime();
  }

  // "last night" - approximate to 10:00 PM yesterday in user's timezone
  if (normalized === "last night") {
    if (timezone) {
      const zonedNow = toZonedTime(now, timezone);
      const zonedYesterday = subDays(startOfDay(zonedNow), 1);
      const zonedLastNight = setHours(zonedYesterday, 22);
      return fromZonedTime(zonedLastNight, timezone).getTime();
    }
    const yesterday = subDays(startOfDay(now), 1);
    return setHours(yesterday, 22).getTime();
  }

  // "earlier today" - approximate to 2 hours ago
  if (normalized === "earlier today" || normalized === "earlier") {
    return subHours(now, 2).getTime();
  }

  // Not a recognized relative time expression
  return null;
}

/**
 * Parses natural language time strings and converts them to timestamps.
 * Supports:
 * - Relative times: "an hour ago", "30 minutes ago", "yesterday", "this morning"
 * - 12-hour format: "1pm", "2pm", "1:30pm"
 * - 24-hour format: "13:00", "14:30"
 * - Special cases: "noon", "midnight"
 * 
 * @param timeString - Time string to parse (e.g., "1pm", "an hour ago", "yesterday")
 * @param referenceDate - Optional reference date (defaults to now)
 * @param timezone - Optional timezone for calculations (e.g., "Asia/Manila")
 * @returns Timestamp in milliseconds, or null if parsing fails
 */
export function parseTimeString(
  timeString: string,
  referenceDate?: Date,
  timezone?: string
): number | null {
  if (!timeString || typeof timeString !== "string") {
    return null;
  }

  const normalized = timeString.trim().toLowerCase();
  const refDate = referenceDate || new Date();
  
  // First, try parsing as a relative time expression
  const relativeResult = parseRelativeTime(normalized, refDate, timezone);
  if (relativeResult !== null) {
    return relativeResult;
  }

  // For absolute times (like "2pm", "14:00"), we need to interpret them in the user's timezone
  // and convert to UTC timestamp
  
  let hours: number | null = null;
  let minutes = 0;

  // Handle special cases
  if (normalized === "noon" || normalized === "12pm" || normalized === "12:00pm") {
    hours = 12;
    minutes = 0;
  } else if (normalized === "midnight" || normalized === "12am" || normalized === "12:00am" || normalized === "00:00") {
    hours = 0;
    minutes = 0;
  } else {
    // Try parsing 12-hour format (e.g., "1pm", "2pm", "1:30pm", "11:45pm")
    const twelveHourMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (twelveHourMatch) {
      hours = parseInt(twelveHourMatch[1], 10);
      minutes = twelveHourMatch[2] ? parseInt(twelveHourMatch[2], 10) : 0;
      const period = twelveHourMatch[3];

      // Validate hours and minutes
      if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
        return null;
      }

      // Convert to 24-hour format
      if (period === "pm" && hours !== 12) {
        hours += 12;
      } else if (period === "am" && hours === 12) {
        hours = 0;
      }
    } else {
      // Try parsing 24-hour format (e.g., "13:00", "14:30", "01:00", "23:59")
      const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
      if (twentyFourHourMatch) {
        hours = parseInt(twentyFourHourMatch[1], 10);
        minutes = parseInt(twentyFourHourMatch[2], 10);

        // Validate hours and minutes
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          return null;
        }
      }
    }
  }

  // If we successfully parsed hours, create the timestamp
  if (hours !== null) {
    if (timezone) {
      // Convert from user's local timezone to UTC
      // Get today's date in the user's timezone
      const zonedNow = toZonedTime(refDate, timezone);
      const zonedToday = startOfDay(zonedNow);
      const zonedTime = setMinutes(setHours(zonedToday, hours), minutes);
      // Convert back to UTC timestamp
      return fromZonedTime(zonedTime, timezone).getTime();
    } else {
      // No timezone specified, use local server time (not ideal but fallback)
      const date = new Date(refDate);
      date.setHours(hours, minutes, 0, 0);
      return date.getTime();
    }
  }

  // If no pattern matches, return null
  return null;
}
