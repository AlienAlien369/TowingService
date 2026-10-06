// Central, lazily-read environment access. Nothing here throws at import time so
// `next build` works without secrets; call sites that need a secret use `required()`.

const read = (k: string, d = "") => process.env[k] ?? d;

export const env = {
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  get appUrl() {
    return read("APP_URL", "http://localhost:3000").replace(/\/$/, "");
  },
  get authSecret() {
    return read("AUTH_SECRET", "dev-only-secret-change-me-please-0123456789");
  },
  get brandName() {
    return read("BRAND_NAME", "RoadSaathi");
  },
  get adminEmail() {
    return read("ADMIN_EMAIL").trim().toLowerCase();
  },
  get databaseUrl() {
    return read("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/towing");
  },
  smtp: {
    get host() {
      return read("SMTP_HOST", "localhost");
    },
    get port() {
      return Number(read("SMTP_PORT", "1025"));
    },
    get user() {
      return read("SMTP_USER");
    },
    get pass() {
      return read("SMTP_PASS");
    },
    get secure() {
      return read("SMTP_SECURE") === "true";
    },
    get from() {
      return read("EMAIL_FROM");
    },
  },
  get smsProvider() {
    return read("SMS_PROVIDER", "mock") as "mock" | "msg91";
  },
  msg91: {
    get authKey() {
      return read("MSG91_AUTH_KEY");
    },
    get senderId() {
      return read("MSG91_SENDER_ID");
    },
    get otpTemplateId() {
      return read("MSG91_OTP_TEMPLATE_ID");
    },
  },
  get mapProvider() {
    return read("MAP_PROVIDER", "osm") as "osm" | "google";
  },
  get googleMapsKey() {
    return read("GOOGLE_MAPS_API_KEY");
  },
  get nominatimUrl() {
    return read("NOMINATIM_URL", "https://nominatim.openstreetmap.org").replace(/\/$/, "");
  },
  get osrmUrl() {
    return read("OSRM_URL", "https://router.project-osrm.org").replace(/\/$/, "");
  },
  razorpay: {
    get keyId() {
      return read("RAZORPAY_KEY_ID");
    },
    get keySecret() {
      return read("RAZORPAY_KEY_SECRET");
    },
    get webhookSecret() {
      return read("RAZORPAY_WEBHOOK_SECRET");
    },
  },
  get cronSecret() {
    return read("CRON_SECRET", "dev-cron-secret");
  },
  /** Show OTP codes in the UI (demo / local only). Never enable on a real production deployment. */
  get exposeDevOtp() {
    const v = read("EXPOSE_DEV_OTP");
    return v ? v === "true" : !this.isProd;
  },
};
