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
 * Parses natural language time strings and converts them to timestamps.
 * Supports 12-hour format (1pm, 2pm, 1:30pm), 24-hour format (13:00, 14:30),
 * and special cases (noon, midnight).
 * 
 * @param timeString - Time string to parse (e.g., "1pm", "2pm", "1:30pm", "13:00", "noon")
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Timestamp in milliseconds, or null if parsing fails
 */
export function parseTimeString(timeString: string, referenceDate?: Date): number | null {
  if (!timeString || typeof timeString !== "string") {
    return null;
  }

  const normalized = timeString.trim().toLowerCase();
  const refDate = referenceDate || new Date();
  
  // Create a new date object set to today at midnight
  const date = new Date(refDate);
  date.setHours(0, 0, 0, 0);

  // Handle special cases
  if (normalized === "noon" || normalized === "12pm" || normalized === "12:00pm") {
    date.setHours(12, 0, 0, 0);
    return date.getTime();
  }

  if (normalized === "midnight" || normalized === "12am" || normalized === "12:00am" || normalized === "00:00") {
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  // Try parsing 12-hour format (e.g., "1pm", "2pm", "1:30pm", "11:45pm")
  const twelveHourMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (twelveHourMatch) {
    let hours = parseInt(twelveHourMatch[1], 10);
    const minutes = twelveHourMatch[2] ? parseInt(twelveHourMatch[2], 10) : 0;
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

    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  }

  // Try parsing 24-hour format (e.g., "13:00", "14:30", "01:00", "23:59")
  const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = parseInt(twentyFourHourMatch[1], 10);
    const minutes = parseInt(twentyFourHourMatch[2], 10);

    // Validate hours and minutes
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  }

  // If no pattern matches, return null
  return null;
}
