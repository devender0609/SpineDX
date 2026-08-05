import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BREAKPOINTS = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "tablet-landscape-1024", width: 1024, height: 900 },
  { name: "tablet-portrait-768", width: 768, height: 1000 },
  { name: "mobile-390", width: 390, height: 844 },
];

const OUT = process.env.SHOT_DIR ?? "docs/screenshots";
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
mkdirSync(OUT, { recursive: true });

const failures = [];
const browser = await chromium.launch();

for (const bp of BREAKPOINTS) {
  const ctx = await browser.newContext({ viewport: { width: bp.width, height: bp.height } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // load the demonstration case so the results view has real content
  const demo = page.getByRole("button", { name: /demonstration case/i });
  if (await demo.count()) { await demo.first().click(); await page.waitForTimeout(400); }

  await page.screenshot({ path: `${OUT}/${bp.name}-entry.png`, fullPage: true });

  // ---- automated layout assertions ----
  const scrollX = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (bp.width >= 1024 && scrollX > 1)
    failures.push(`${bp.name}: horizontal scroll of ${scrollX}px`);

  // any element overflowing the viewport horizontally
  // An element inside a deliberately scrollable ancestor is not a layout defect; an element
  // that pushes the PAGE wider than the viewport is. Only the latter is flagged.
  const overflow = await page.evaluate((vw) => {
    const inScroller = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
      }
      return false;
    };
    const bad = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 2 || r.left < -2) && !inScroller(el)) {
        bad.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`);
      }
    }
    return [...new Set(bad)].slice(0, 6);
  }, bp.width);
  if (overflow.length) failures.push(`${bp.name}: overflowing ${overflow.join(", ")}`);

  // spinal level labels must never wrap
  const wrapped = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("*")) {
      if (el.children.length) continue;
      const t = (el.textContent || "").trim();
      if (/^L\d[–-]?(S1|\d)$/.test(t)) {
        const cs = getComputedStyle(el);
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
        if (el.getBoundingClientRect().height > lh * 1.6) bad.push(t);
      }
    }
    return bad;
  });
  if (wrapped.length) failures.push(`${bp.name}: wrapped level label(s) ${wrapped.join(", ")}`);

  // cards rendering a heading with no content
  const empty = await page.evaluate(() => {
    const bad = [];
    for (const card of document.querySelectorAll(".card, section.card")) {
      const body = card.querySelector(".card-body") ?? card;
      const text = (body.textContent || "").replace((card.querySelector("h2,h3")?.textContent) || "", "").trim();
      if (text.length === 0) bad.push((card.querySelector("h2,h3")?.textContent || "untitled").trim());
    }
    return bad;
  });
  if (empty.length) failures.push(`${bp.name}: empty card(s) ${empty.join(", ")}`);

  // touch targets
  const small = await page.evaluate(() => {
    let n = 0;
    for (const b of document.querySelectorAll("button")) {
      const r = b.getBoundingClientRect();
      if (r.height > 0 && r.height < 32) n++;
    }
    return n;
  });
  if (bp.width <= 768 && small > 0) failures.push(`${bp.name}: ${small} button(s) under 32px tall`);

  await ctx.close();
  console.log(`  captured ${bp.name}`);
}

await browser.close();

if (failures.length) {
  console.error("\nVISUAL CHECKS FAILED:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("\nAll visual checks passed at 1440 / 1024 / 768 / 390.");
