
export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function isoParts(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, monthIndex: month - 1, day };
}

export function startOfMonthIso(year, monthIndex) {
  return toIsoDate(new Date(year, monthIndex, 1));
}

export function endOfMonthIso(year, monthIndex) {
  return toIsoDate(new Date(year, monthIndex + 1, 0));
}

export function addMonths(year, monthIndex, delta) {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function isWithin(iso, start, end) {
  return iso >= start && iso <= end;
}

export function orderRange(a, b) {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

const WEEK_LENGTH = 7;

export function monthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const leading = (first.getDay() + 6) % WEEK_LENGTH;
  const start = new Date(year, monthIndex, 1 - leading);

  const weeks = [];
  const cursor = new Date(start);
  for (let week = 0; week < 6; week += 1) {
    const days = [];
    for (let day = 0; day < WEEK_LENGTH; day += 1) {
      days.push({
        iso: toIsoDate(cursor),
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === monthIndex,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}

export function daySelection(iso) {
  return { mode: "day", start: iso, end: iso };
}

export function monthSelection(year, monthIndex) {
  return {
    mode: "month",
    start: startOfMonthIso(year, monthIndex),
    end: endOfMonthIso(year, monthIndex),
  };
}

export function yearSelection(year) {
  return {
    mode: "year",
    start: toIsoDate(new Date(year, 0, 1)),
    end: toIsoDate(new Date(year, 11, 31)),
  };
}

export function rangeSelection(a, b) {
  const { start, end } = orderRange(a, b);
  return { mode: "range", start, end };
}

export function datesBetween(startIso, endIso) {
  const dates = [];
  const cursor = fromIsoDate(startIso);
  const end = fromIsoDate(endIso);
  while (cursor <= end) {
    dates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

const MS_PER_DAY = 86_400_000;

export function splitRangeInHalf(startIso, endIso) {
  const totalDays =
    Math.round((fromIsoDate(endIso) - fromIsoDate(startIso)) / MS_PER_DAY) + 1;
  const currentDays = Math.max(1, Math.floor(totalDays / 2));

  const boundary = fromIsoDate(endIso);
  boundary.setDate(boundary.getDate() - currentDays + 1);
  const boundaryIso = toIsoDate(boundary);

  const previousEnd = fromIsoDate(boundaryIso);
  previousEnd.setDate(previousEnd.getDate() - 1);

  return {
    previous: { start: startIso, end: toIsoDate(previousEnd) },
    current: { start: boundaryIso, end: endIso },
  };
}
