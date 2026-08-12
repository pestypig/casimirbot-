export type UsMarketClock = {
  tradingDate: string;
  session: "pre" | "regular" | "post" | "closed";
  minutesSinceRegularOpen: number;
  minutesUntilRegularClose: number;
  holiday: boolean;
};

const newYorkParts = (now: Date): {
  year: number;
  month: number;
  day: number;
  weekday: string;
  hour: number;
  minute: number;
} => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    weekday: value("weekday"),
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
};

const dateKey = (year: number, month: number, day: number): string =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const utcWeekday = (year: number, month: number, day: number): number =>
  new Date(Date.UTC(year, month - 1, day)).getUTCDay();

const nthWeekday = (
  year: number,
  month: number,
  weekday: number,
  nth: number,
): number => {
  const first = utcWeekday(year, month, 1);
  return 1 + ((weekday - first + 7) % 7) + (nth - 1) * 7;
};

const lastWeekday = (
  year: number,
  month: number,
  weekday: number,
): number => {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = utcWeekday(year, month, lastDay);
  return lastDay - ((last - weekday + 7) % 7);
};

const observedFixed = (year: number, month: number, day: number): string => {
  const weekday = utcWeekday(year, month, day);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (weekday === 6) date.setUTCDate(date.getUTCDate() - 1);
  if (weekday === 0) date.setUTCDate(date.getUTCDate() + 1);
  return dateKey(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
};

const easterSunday = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
};

const marketHolidays = (year: number): Set<string> => {
  const easter = easterSunday(year);
  easter.setUTCDate(easter.getUTCDate() - 2);
  const holidays = new Set<string>([
    observedFixed(year, 1, 1),
    dateKey(year, 1, nthWeekday(year, 1, 1, 3)),
    dateKey(year, 2, nthWeekday(year, 2, 1, 3)),
    dateKey(easter.getUTCFullYear(), easter.getUTCMonth() + 1, easter.getUTCDate()),
    dateKey(year, 5, lastWeekday(year, 5, 1)),
    observedFixed(year, 6, 19),
    observedFixed(year, 7, 4),
    dateKey(year, 9, nthWeekday(year, 9, 1, 1)),
    dateKey(year, 11, nthWeekday(year, 11, 4, 4)),
    observedFixed(year, 12, 25),
  ]);
  const nextNewYearObserved = observedFixed(year + 1, 1, 1);
  if (nextNewYearObserved.startsWith(`${year}-`)) holidays.add(nextNewYearObserved);
  return holidays;
};

export const readUsMarketClock = (now: Date): UsMarketClock => {
  if (!Number.isFinite(now.getTime())) throw new Error("invalid market clock");
  const parts = newYorkParts(now);
  const tradingDate = dateKey(parts.year, parts.month, parts.day);
  const holiday = marketHolidays(parts.year).has(tradingDate);
  const weekday = parts.weekday !== "Sat" && parts.weekday !== "Sun";
  const minute = parts.hour * 60 + parts.minute;
  const openMinute = 9 * 60 + 30;
  const closeMinute = 16 * 60;
  const session = !weekday || holiday
    ? "closed"
    : minute < openMinute
      ? "pre"
      : minute < closeMinute
        ? "regular"
        : "post";
  return {
    tradingDate,
    session,
    minutesSinceRegularOpen: minute - openMinute,
    minutesUntilRegularClose: closeMinute - minute,
    holiday,
  };
};
