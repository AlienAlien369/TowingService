import { randomInt } from "node:crypto";

export type ClassValue = string | false | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach(walk);
    else out.push(v);
  };
  inputs.forEach(walk);
  return out.join(" ");
}

// ── money (all amounts are integer paise internally) ──
export const rupeesToPaise = (r: number) => Math.round(r * 100);
export const paiseToRupees = (p: number) => p / 100;

export function formatINR(paise: number, opts: { decimals?: boolean } = {}): string {
  const whole = paise % 100 === 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: opts.decimals || !whole ? 2 : 0,
    maximumFractionDigits: opts.decimals || !whole ? 2 : 0,
  }).format(paise / 100);
}

// ── geo ──
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// ── ids / codes ──
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L

export function randomCode(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}

export const randomPin = () => String(randomInt(1000, 10000));
export const randomOtp = () => String(randomInt(100000, 1000000));

// ── input normalisation ──
export function normalizeEmail(input: string): string | null {
  const v = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254 ? v : null;
}

/** Returns +91XXXXXXXXXX for valid Indian mobile numbers, else null. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  const ten = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? `+91${ten}` : null;
}

export const maskPhone = (p: string) => (p.length > 6 ? `${p.slice(0, 3)}${"•".repeat(p.length - 6)}${p.slice(-3)}` : p);

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** {{key}} → value. Unknown keys are left intact so mistakes are visible. */
export function renderTemplate(tpl: string, vars: Record<string, string | number | undefined | null>): string {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k: string) => {
    const v = vars[k];
    return v === undefined || v === null ? m : String(v);
  });
}

export function indianFinancialYear(d = new Date()): string {
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1; // FY starts 1 April
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isoDate(d: Date | string | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}
