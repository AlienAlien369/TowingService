import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "@/shared/lib/env";
import { normalizePhone } from "@/shared/lib/utils";

// Firebase ID tokens are RS256 JWTs signed by Google's securetoken service.
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));

export type FirebasePhone = { ok: true; phone: string } | { ok: false; error: string };

/** Verifies a Firebase ID token minted by phone sign-in and returns the verified +91 number. */
export async function verifyFirebasePhoneToken(idToken: string): Promise<FirebasePhone> {
  const projectId = env.firebase.projectId;
  if (!env.firebase.enabled) return { ok: false, error: "Phone verification is not available right now." };
  try {
    const { payload } = await jwtVerify(idToken, JWKS, { issuer: `https://securetoken.google.com/${projectId}`, audience: projectId, algorithms: ["RS256"] });
    const provider = (payload.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider;
    const phone = typeof payload.phone_number === "string" ? normalizePhone(payload.phone_number) : null;
    if (provider !== "phone" || !phone || !payload.sub) return { ok: false, error: "We couldn't verify this number. Please try again." };
    return { ok: true, phone };
  } catch {
    return { ok: false, error: "Verification expired. Please request a new code." };
  }
}
