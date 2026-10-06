import { z } from "zod";
import { env } from "@/shared/lib/env";

const loc = (en: string, hi = "") => z.object({ en: z.string().default(en), hi: z.string().default(hi) }).prefault({});
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #FFC400");

/** Every group is fully defaulted: `schema.parse({})` yields a working configuration. */
export const settingSchemas = {
  brand: z.object({
    name: z.string().min(1).max(40).default(() => env.brandName),
    legalName: z.string().default(""),
    tagline: loc("Delhi's fastest towing & roadside rescue", "दिल्ली की सबसे तेज़ टोइंग और रोडसाइड रेस्क्यू सेवा"),
    description: loc(
      "24x7 car, bike, truck and heavy-vehicle towing across Delhi. Transparent pricing, live tracking, verified drivers.",
      "पूरी दिल्ली में 24x7 कार, बाइक, ट्रक और भारी वाहन टोइंग। पारदर्शी रेट, लाइव ट्रैकिंग, वेरिफ़ाइड ड्राइवर।",
    ),
    logoUrl: z.string().default(""),
    primaryColor: color.default("#FFC400"),
    inkColor: color.default("#14161A"),
    facebook: z.string().default(""),
    instagram: z.string().default(""),
    x: z.string().default(""),
    youtube: z.string().default(""),
    linkedin: z.string().default(""),
  }),
  contact: z.object({
    phone: z.string().default("+91 11 4000 0000"),
    emergencyPhone: z.string().default("+91 90000 00000"),
    whatsapp: z.string().default("919000000000"),
    email: z.string().default("help@roadsaathi.example"),
    supportEmail: z.string().default("support@roadsaathi.example"),
    partnersEmail: z.string().default("partners@roadsaathi.example"),
    addressLine: z.string().default("Plot 12, Okhla Industrial Estate, Phase III"),
    city: z.string().default("New Delhi"),
    state: z.string().default("Delhi"),
    pincode: z.string().default("110020"),
    hours: z.string().default("24 x 7 x 365"),
    lat: z.coerce.number().default(28.5355),
    lng: z.coerce.number().default(77.2706),
  }),
  business: z.object({
    legalName: z.string().default("RoadSaathi Mobility Private Limited"),
    gstin: z.string().default("07AAAAA0000A1Z5"),
    pan: z.string().default("AAAAA0000A"),
    cin: z.string().default(""),
    stateCode: z.string().default("07"),
    stateName: z.string().default("Delhi"),
    sacCode: z.string().default("996799"),
    gstRatePct: z.coerce.number().min(0).max(40).default(18),
    invoicePrefix: z.string().default("RS"),
    bookingPrefix: z.string().max(5).default("RS"),
    invoiceFooter: z.string().default("This is a computer generated invoice and does not require a signature."),
  }),
  pricing: z.object({
    nightStartHour: z.coerce.number().int().min(0).max(23).default(22),
    nightEndHour: z.coerce.number().int().min(0).max(23).default(6),
    nightMultiplier: z.coerce.number().min(1).max(5).default(1.25),
    surgeMultiplier: z.coerce.number().min(1).max(5).default(1),
    freeWaitingMinutes: z.coerce.number().int().min(0).default(10),
    cancellationFeeRupees: z.coerce.number().min(0).default(100),
    platformCommissionPct: z.coerce.number().min(0).max(60).default(20),
    roundToRupee: z.coerce.boolean().default(true),
  }),
  dispatch: z.object({
    searchRadiusKm: z.coerce.number().min(1).max(100).default(15),
    offerTimeoutSec: z.coerce.number().int().min(15).max(600).default(90),
    offersPerRound: z.coerce.number().int().min(1).max(10).default(3),
    maxRounds: z.coerce.number().int().min(1).max(10).default(3),
    driverFreshnessMin: z.coerce.number().int().min(1).max(120).default(15),
    allowScheduling: z.coerce.boolean().default(true),
  }),
  payments: z.object({
    cashEnabled: z.coerce.boolean().default(true),
    /** coming_soon: shown but disabled. test/live: enabled once RAZORPAY_* keys are present. */
    razorpayMode: z.enum(["coming_soon", "test", "live"]).default("coming_soon"),
  }),
  maps: z.object({
    provider: z.enum(["env", "osm", "google"]).default("env"),
    tileUrl: z.string().default("https://tile.openstreetmap.org/{z}/{x}/{y}.png"),
    centerLat: z.coerce.number().default(28.6139),
    centerLng: z.coerce.number().default(77.209),
    zoom: z.coerce.number().int().default(11),
  }),
  notifications: z.object({
    fromName: z.string().default(""),
    fromEmail: z.string().default(""),
    adminAlertEmail: z.string().default(""),
    emailCustomers: z.coerce.boolean().default(true),
    emailDrivers: z.coerce.boolean().default(true),
    emailCompanies: z.coerce.boolean().default(true),
    smsCustomers: z.coerce.boolean().default(true),
    smsDrivers: z.coerce.boolean().default(true),
  }),
  seo: z.object({
    titleSuffix: z.string().default(""),
    keywords: z.string().default("towing service Delhi, car towing Delhi, bike towing, flatbed tow truck, roadside assistance, accident recovery, vehicle breakdown Delhi"),
    googleAnalyticsId: z.string().default(""),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type Settings = { [K in SettingKey]: z.infer<(typeof settingSchemas)[K]> };
export const SETTING_KEYS = Object.keys(settingSchemas) as SettingKey[];
