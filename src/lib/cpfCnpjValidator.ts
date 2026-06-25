import { onlyDigits } from "./docMask";

function calcCpfDv(base: string): number {
  const len = base.length;
  let sum = 0;
  for (let i = 0; i < len; i++) sum += parseInt(base[i], 10) * (len + 1 - i);
  const r = (sum * 10) % 11;
  return r === 10 ? 0 : r;
}

export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const dv1 = calcCpfDv(d.slice(0, 9));
  const dv2 = calcCpfDv(d.slice(0, 9) + dv1);
  return d.endsWith(`${dv1}${dv2}`);
}

function calcCnpjDv(base: string): number {
  const weights = base.length === 12
    ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * weights[i];
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

export function isValidCnpj(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const dv1 = calcCnpjDv(d.slice(0, 12));
  const dv2 = calcCnpjDv(d.slice(0, 12) + dv1);
  return d.endsWith(`${dv1}${dv2}`);
}

export function isValidCpfCnpj(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length === 11) return isValidCpf(d);
  if (d.length === 14) return isValidCnpj(d);
  return false;
}

export function maskCpfCnpjDisplay(value: string): string {
  const d = onlyDigits(value);
  if (d.length === 11) return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0, 2)}.***.***/${d.slice(8, 12)}-${d.slice(12)}`;
  return value;
}
