const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

export const revalidate = 86400;

// /pricing.md — machine-readable pricing & payment info for AI agents & LLMs.
export async function GET() {
  const body = `# Pricing & Payments — Real Duck Distro

## How pricing works
- Prices are listed per product on each product page. Every product shows two prices:
  - Local price (local pickup)
  - Shipping price (discreet nationwide delivery)
- Currency: USD.

## Discounts (stackable, up to 20% off)
- Crypto payment: 10% off the entire order
- Web app install (add to home screen): 10% off every order
- Both together: 20% off

## Payment methods
- Zelle
- Cash App
- Chime
- Cryptocurrency: Bitcoin (BTC), Ethereum (ETH), USDT

## Checkout options
- Express (fast) order: minimum cart total $200
- Detailed checkout: no minimum
- Disposables: minimum order quantity applies (shown at checkout)

## Order flow
1. Place order (order is held pending payment)
2. We send payment details for your chosen method
3. Once payment is confirmed, the order ships (see ${SITE_URL}/shipping.md)

## Contact
- Email: contact@realduckdistro.com
- Catalog: ${SITE_URL}/
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
