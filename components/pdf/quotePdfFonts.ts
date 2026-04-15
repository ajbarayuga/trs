import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Font } from "@react-pdf/renderer";

/**
 * Registers fonts to approximate the Jones Room reference PDF (Arial + Proxima Nova).
 * Uses Arimo + Montserrat from @fontsource (WOFF). Paths must not rely on process.cwd()
 * alone — Turbopack can set cwd to a parent folder when multiple lockfiles exist, which
 * previously pointed at the wrong node_modules and broke font parsing (DataView errors).
 */

function findBennetProjectRoot(): string {
  const candidates = [
    path.dirname(fileURLToPath(import.meta.url)),
    process.cwd(),
  ];
  for (const start of candidates) {
    let dir = start;
    for (let i = 0; i < 30; i++) {
      const pkgPath = path.join(dir, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
            name?: string;
          };
          if (pkg.name === "bennet") return dir;
        } catch {
          /* ignore */
        }
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return process.cwd();
}

const bennetRoot = findBennetProjectRoot();
const requireFromBennet = createRequire(
  path.join(bennetRoot, "package.json"),
);

function fontFile(pkgName: string, filename: string): string {
  const pkgJson = requireFromBennet.resolve(`${pkgName}/package.json`);
  return path.join(path.dirname(pkgJson), "files", filename);
}

let didRegister = false;

/**
 * Resolved font family names for @react-pdf/renderer.
 * On Vercel, WOFF files are sometimes omitted from the serverless trace; if
 * registration fails we fall back to built-in PDF fonts so quote email still works.
 */
export const quotePdfFontFamily = {
  body: "QuoteBody",
  display: "QuoteDisplay",
} as { body: string; display: string };

export function registerQuotePdfFonts() {
  if (didRegister) return;
  didRegister = true;

  try {
    Font.register({
      family: "QuoteBody",
      fonts: [
        {
          src: fontFile("@fontsource/arimo", "arimo-latin-400-normal.woff"),
          fontWeight: 400,
          fontStyle: "normal",
        },
        {
          src: fontFile("@fontsource/arimo", "arimo-latin-700-normal.woff"),
          fontWeight: 700,
          fontStyle: "normal",
        },
        {
          src: fontFile("@fontsource/arimo", "arimo-latin-400-italic.woff"),
          fontWeight: 400,
          fontStyle: "italic",
        },
      ],
    });

    Font.register({
      family: "QuoteDisplay",
      fonts: [
        {
          src: fontFile(
            "@fontsource/montserrat",
            "montserrat-latin-600-normal.woff",
          ),
          fontWeight: 600,
          fontStyle: "normal",
        },
        {
          src: fontFile(
            "@fontsource/montserrat",
            "montserrat-latin-700-normal.woff",
          ),
          fontWeight: 700,
          fontStyle: "normal",
        },
        {
          src: fontFile(
            "@fontsource/montserrat",
            "montserrat-latin-800-normal.woff",
          ),
          fontWeight: 800,
          fontStyle: "normal",
        },
      ],
    });
  } catch (e) {
    console.error(
      "[quotePdfFonts] Custom font registration failed, using Helvetica:",
      e instanceof Error ? e.message : e,
    );
    quotePdfFontFamily.body = "Helvetica";
    quotePdfFontFamily.display = "Helvetica-Bold";
  }
}

registerQuotePdfFonts();
