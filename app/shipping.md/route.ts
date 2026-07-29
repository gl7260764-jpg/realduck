const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

export const revalidate = 86400;

// /shipping.md — machine-readable shipping info for AI agents & LLMs.
export async function GET() {
  const body = `# Shipping — Real Duck Distro

## Coverage
- United States: all 50 states
- Australia: nationwide
- Worldwide: international shipping available
- Priority delivery states: Kentucky, Michigan, Florida, Mississippi

## Origin
- Los Angeles, California, USA
- Sydney, NSW, Australia

## Delivery times
- United States: 1–3 business days (priority states fastest)
- Australia: 1–5 business days
- International: varies by destination

## Packaging
- Smell-proof and vacuum-sealed
- Plain, unbranded exterior — no reference to contents or brand
- Neutral return address on labels

## Discretion & tracking
- Every order ships discreetly
- Tracking provided after dispatch

## Handling
- Orders are placed on hold until payment is confirmed, then dispatched (typically same or next day)

## Contact
- Email: contact@realduckdistro.com
- More: ${SITE_URL}/faq
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
