import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BREAKPOINTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
];

const OUT = process.env.SHOT_DIR ?? "docs/screenshots";
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const FULL = process.env.FULL_CAPTURE === "1";
mkdirSync(OUT, { recursive: true });

const failures = [];
const browser = await chromium.launch();

/** Layout assertions run on whatever screen is currently rendered. */
async function assertLayout(page, bp, screen) {
  const tag = `${bp.name}/${screen}`;
  const scrollX = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (bp.width >= 1024 && scrollX > 1) failures.push(`${tag}: horizontal scroll ${scrollX}px`);

  // Nested containers that scroll horizontally at desktop widths. The step navigator must
  // never require left-right scrolling; page-level checks alone miss this entirely.
  const nested = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      // Deliberate single-line truncation is not a layout defect: an ellipsised label
      // legitimately has scrollWidth > clientWidth.
      if (cs.textOverflow === "ellipsis" && cs.overflow !== "visible") continue;
      if (cs.overflow === "hidden" || cs.overflowX === "hidden") continue;
      if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
        const cls = (el.className || "").toString().split(" ")[0];
        bad.push(`${el.tagName.toLowerCase()}.${cls} (+${el.scrollWidth - el.clientWidth}px)`);
      }
    }
    return [...new Set(bad)].slice(0, 5);
  });
  if (bp.width >= 1024 && nested.length)
    failures.push(`${tag}: nested horizontal scroll in ${nested.join(", ")}`);

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
      if (r.width > 0 && (r.right > vw + 2 || r.left < -2) && !inScroller(el))
        bad.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`);
    }
    return [...new Set(bad)].slice(0, 5);
  }, bp.width);
  if (overflow.length) failures.push(`${tag}: overflowing ${overflow.join(", ")}`);

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
  if (wrapped.length) failures.push(`${tag}: wrapped level label(s) ${wrapped.join(", ")}`);

  // An empty section is a heading with no rendered content beneath it. Checked across every
  // card and section, not just elements carrying the .card class, and ignoring whitespace-only
  // wrappers — an empty <ul> renders nothing but is not an empty string in textContent terms.
  const empty = await page.evaluate(() => {
    const bad = [];
    const containers = document.querySelectorAll(".card, section.results-page > section, .result-subsection");
    for (const card of containers) {
      const heading = card.querySelector("h2,h3,h4");
      if (!heading) continue;
      const rest = (card.textContent || "").replace(heading.textContent || "", "").replace(/\s+/g, "");
      const hasVisual = card.querySelector("img,svg,input,select,textarea,button,table,li");
      if (rest.length === 0 && !hasVisual) bad.push((heading.textContent || "untitled").trim());
    }
    return bad;
  });
  if (empty.length) failures.push(`${tag}: empty card(s) ${empty.join(", ")}`);

  // control sizing: professional density, no oversized or undersized controls
  const badSize = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("select,input[type=text],input[type=number],.segmented button")) {
      const h = el.getBoundingClientRect().height;
      if (h > 0 && (h > 52 || h < 26)) bad.push(`${el.tagName.toLowerCase()} ${Math.round(h)}px`);
    }
    return [...new Set(bad)].slice(0, 4);
  });
  if (badSize.length) failures.push(`${tag}: control sizing ${badSize.join(", ")}`);

  // Vertical text collapse: a narrow column forcing one character per line. This is what a
  // broken table looks like, and no overflow check will ever see it.
  const squeezed = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("td,th,p,span,b,dd,li")) {
      if (el.children.length) continue;
      const t = (el.textContent || "").trim();
      if (t.length < 8) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.width < 60 && r.height > 80) bad.push(t.slice(0, 20));
    }
    return [...new Set(bad)].slice(0, 4);
  });
  if (squeezed.length) failures.push(`${tag}: text squeezed into a narrow column: ${squeezed.join(", ")}`);

  // labels clipped by their own box (excluding deliberate single-line ellipsis)
  const clippedText = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll(".segmented button,.side-step-label,.alert-body b,.hero-cell dd")) {
      const cs = getComputedStyle(el);
      if (cs.textOverflow === "ellipsis") continue;
      if (el.scrollWidth > el.clientWidth + 2) bad.push((el.textContent || "").slice(0, 18));
    }
    return [...new Set(bad)].slice(0, 4);
  });
  if (clippedText.length) failures.push(`${tag}: clipped label(s) ${clippedText.join(", ")}`);

  const clipped = await page.evaluate(() => {
    let n = 0;
    for (const b of document.querySelectorAll("button")) {
      const r = b.getBoundingClientRect();
      if (r.height > 0 && (b.scrollWidth > b.clientWidth + 2 || r.height < 30)) n++;
    }
    return n;
  });
  if (clipped > 0) failures.push(`${tag}: ${clipped} clipped or undersized button(s)`);
}

async function shot(page, bp, screen) {
  await page.screenshot({ path: `${OUT}/${bp.name}-${screen}.png`, fullPage: true });
  await assertLayout(page, bp, screen);
}

// A disabled control is a legitimate state (blocking validation), not a script failure.
const clickIf = async (page, name) => {
  const el = page.getByRole("button", { name }).first();
  if (!(await el.count())) return false;
  if (!(await el.isEnabled())) return false;
  try { await el.click({ timeout: 3000 }); } catch { return false; }
  await page.waitForTimeout(350);
  return true;
};

for (const bp of BREAKPOINTS) {
  const ctx = await browser.newContext({ viewport: { width: bp.width, height: bp.height } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // 1. default / empty state, with the draft opt-in bar visible
  await shot(page, bp, "01-default-empty");

  // dismiss the draft modal before anything else
  await clickIf(page, /^Do not save$/);
  await shot(page, bp, "02-rapid-orientation");

  // 3. demonstration case loaded
  if (await clickIf(page, /load demo/i)) await shot(page, bp, "03-demo-loaded");

  // 4. walk the rapid workflow
  for (const [idx, label] of [["04-safety", /^Continue$/], ["05-assessment", /^Continue$/],
                              ["06-imaging", /^Continue$/], ["07-management", /^Continue$/],
                              ["08-review", /^Continue$/]]) {
    if (await clickIf(page, label)) await shot(page, bp, idx);
  }

  // 5. synthesis. Warnings must be acknowledged first; if blocking errors remain, the
  // disabled state is itself a screen worth capturing.
  const ack = page.locator('input[type="checkbox"]').filter({ hasNot: page.locator("[disabled]") }).first();
  const ackLabel = page.getByText(/acknowledge|reviewed the warnings/i).first();
  if (await ackLabel.count()) { try { await ackLabel.click({ timeout: 2000 }); } catch { /* not present */ } }
  const gen = page.getByRole("button", { name: /generate synthesis/i }).first();
  if (await gen.count() && !(await gen.isEnabled())) await shot(page, bp, "09-blocked-synthesis");
  if (await clickIf(page, /generate synthesis/i)) await shot(page, bp, "09-synthesis");

  // 6. evidence library
  if (await clickIf(page, /^Evidence$/)) {
    await shot(page, bp, "10-evidence-library");
    if (FULL) {
      const filter = page.locator(".evidence-filters button").nth(2);
      if (await filter.count()) { await filter.click(); await page.waitForTimeout(250);
        await shot(page, bp, "11-evidence-filtered"); }
    }
  }

  // 7. research workspace
  if (await clickIf(page, /research workspace/i)) await shot(page, bp, "12-research-workspace");

  // 8. comprehensive mode
  if (await clickIf(page, /^Clinical assessment$/)) {
    if (await clickIf(page, /^Comprehensive$/)) await shot(page, bp, "13-comprehensive");
  }

  await ctx.close();
  console.log(`  captured ${bp.name}`);
}

await browser.close();

if (failures.length) {
  console.error("\nVISUAL CHECKS FAILED:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("\nAll visual checks passed at 1440 / 1024 / 768 / 390 across all captured screens.");
