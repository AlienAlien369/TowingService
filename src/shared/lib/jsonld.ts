/** Serialises structured data for <script type="application/ld+json"> without allowing "</script>" breakouts. */
export const toJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\u003c");
