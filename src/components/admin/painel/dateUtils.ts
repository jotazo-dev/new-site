export const WEEKDAYS_MON_FIRST = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
export const WEEKDAY_LONG = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Monday=0..Sunday=6 (offset within a Mon-first week) */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return addDays(x, -mondayIndex(x));
}

export function endOfWeekSunday(d: Date): Date {
  return addDays(startOfWeekMonday(d), 6);
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function formatShort(d: Date): string {
  return `${pad(d.getDate())}/${MONTH_SHORT[d.getMonth()]}`;
}

export function formatRange(from: Date, to: Date): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  const left = formatShort(from);
  const right = formatShort(to);
  return sameYear
    ? `${left} – ${right} ${to.getFullYear()}`
    : `${left} ${from.getFullYear()} – ${right} ${to.getFullYear()}`;
}

export function formatDayLong(d: Date): string {
  return `${WEEKDAY_LONG[d.getDay()]}, ${pad(d.getDate())} de ${MONTH_NAMES[d.getMonth()]} de ${d.getFullYear()}`;
}
