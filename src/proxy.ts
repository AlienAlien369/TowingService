import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["en", "hi"];

/** Locale routing: every page lives under /en or /hi. Bare paths redirect to the best-matching locale. */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return NextResponse.next();

  const cookie = req.cookies.get("rs_locale")?.value;
  const accept = req.headers.get("accept-language") ?? "";
  const locale = cookie && LOCALES.includes(cookie) ? cookie : /^hi\b/i.test(accept) ? "hi" : "en";

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|icon|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml|.*\..*).*)"],
};
