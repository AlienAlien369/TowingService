// Builds the PDF document packs in docs/pdf/ from the Markdown sources in docs/.
//   cd docs/pdf-build && npm install && npm run build
// Uses the Chromium that Playwright finds; set CHROMIUM_PATH to use a specific binary.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const docs = resolve(here, "..");
const out = join(docs, "pdf");
const css = readFileSync(join(here, "style.css"), "utf8");
const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/** The three packs. Order of files = order of chapters. */
const books = [
  {
    file: "RoadSaathi-Business-and-Project-Plan.pdf",
    title: "Business & Project Plan",
    subtitle: "Market, competitors, laws, risks, AI roadmap, financial model, go-to-market and execution plan",
    audience: "For management review",
    files: [
      "business/01-business-plan.md",
      "business/02-competitor-analysis.md",
      "business/03-legal-regulatory-map.md",
      "business/04-risk-register.md",
      "business/05-ai-roadmap.md",
      "business/06-financial-model.md",
      "business/07-go-to-market.md",
      "product/ROADMAP.md",
    ],
  },
  {
    file: "RoadSaathi-Product-and-Developer-Handbook.pdf",
    title: "Product & Developer Handbook",
    subtitle: "What is built, requirements, architecture, data model, conventions, security, testing and deployment",
    audience: "For product and engineering",
    files: [
      "product/FEATURE-INVENTORY.md",
      "product/PRD.md",
      "ARCHITECTURE.md",
      "developer/DEVELOPER-GUIDE.md",
      "developer/DATA-MODEL.md",
      "developer/SECURITY.md",
      "developer/TESTING.md",
      "developer/CONTRIBUTING.md",
      "DEPLOY.md",
      "tracking-plan.md",
    ],
  },
  {
    file: "RoadSaathi-Operations-and-Compliance-Handbook.pdf",
    title: "Operations & Compliance Handbook",
    subtitle: "Dispatch, partners, support and grievances, damage claims, finance, admin panel, incident response and legal map",
    audience: "For operations, finance and compliance",
    files: [
      "operations/OPERATIONS-SOP.md",
      "ADMIN-GUIDE.md",
      "operations/INCIDENT-RESPONSE.md",
      "business/03-legal-regulatory-map.md",
      "business/04-risk-register.md",
    ],
  },
];

const anchorFor = (file) => "doc-" + file.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

/** Status emoji become text badges so they print the same everywhere. */
const badges = (html) =>
  html
    .replaceAll("✅", '<span class="badge ok">Built</span>')
    .replaceAll("🟡", '<span class="badge part">Partial</span>')
    .replaceAll("⬜", '<span class="badge no">Not built</span>');

function renderDoc(file, book) {
  const src = readFileSync(join(docs, file), "utf8");
  const tokens = marked.lexer(src);
  const h1 = tokens.find((t) => t.type === "heading" && t.depth === 1);
  const title = h1 ? h1.text : file;
  const fromDir = dirname(join(docs, file));
  const inBook = new Set(book.files);

  const renderer = new marked.Renderer();
  const baseLink = renderer.link.bind(renderer);
  renderer.link = function (token) {
    const href = token.href ?? "";
    if (/^(https?:|mailto:|#)/.test(href)) return baseLink(token);
    // Links to other docs: jump inside this PDF when the target is in it, otherwise name the file.
    const target = relative(docs, resolve(fromDir, href.split("#")[0]));
    const text = this.parser.parseInline(token.tokens);
    if (inBook.has(target)) return `<a href="#${anchorFor(target)}">${text}</a>`;
    return `${text} <span class="ref">(docs/${target})</span>`;
  };
  const body = marked.parser(tokens, { renderer, gfm: true });
  return { title, html: `<section class="chapter" id="${anchorFor(file)}">${badges(body)}</section>` };
}

function bookHtml(book) {
  const docsHtml = book.files.map((f) => renderDoc(f, book));
  const toc = docsHtml
    .map((d, i) => `<li><a href="#${anchorFor(book.files[i])}"><span class="n">${String(i + 1).padStart(2, "0")}</span>${d.title}</a></li>`)
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>RoadSaathi — ${book.title}</title><style>${css}</style></head><body>
<section class="cover">
  <div class="hazard"></div>
  <p class="eyebrow">RoadSaathi · Towing &amp; roadside assistance platform</p>
  <h1>${book.title}</h1>
  <p class="sub">${book.subtitle}</p>
  <dl>
    <dt>Audience</dt><dd>${book.audience}</dd>
    <dt>Version</dt><dd>1.0 · ${today}</dd>
    <dt>Source</dt><dd>Generated from the Markdown in <code>docs/</code> of the TowingService repository</dd>
  </dl>
  <p class="note">Confidential. Third-party figures are cited; RoadSaathi projections are planning assumptions. Legal and tax points must be confirmed by qualified advisers.</p>
</section>
<section class="toc"><h2>Contents</h2><ol>${toc}</ol></section>
${docsHtml.map((d) => d.html).join("\n")}
</body></html>`;
}

mkdirSync(out, { recursive: true });
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch({ executablePath });
try {
  for (const book of books) {
    const page = await browser.newPage();
    await page.setContent(bookHtml(book), { waitUntil: "load" });
    await page.pdf({
      path: join(out, book.file),
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font:8px Inter,sans-serif;color:#8a8984;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>RoadSaathi — ${book.title}</span><span>Confidential</span></div>`,
      footerTemplate: `<div style="font:8px Inter,sans-serif;color:#8a8984;width:100%;padding:0 16mm;text-align:right">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    });
    await page.close();
    console.log(`✓ docs/pdf/${book.file}`);
  }
} finally {
  await browser.close();
}
