// Hit the homepage with no-cache to force ISR regeneration of the catalog
// (alternative to running revalidatePath inside an admin context).
async function main() {
  const url = "https://www.realduckdistro.com/?_revalidate=" + Date.now();
  const res = await fetch(url, { cache: "no-store", headers: { "x-purpose": "isr-warm" } });
  console.log(`Warmed homepage: ${res.status}`);
}
main().catch(console.error);
