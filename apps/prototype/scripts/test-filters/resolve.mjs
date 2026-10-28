// Resolve-hook voor de filtertest: "@/x" → src/x en extensieloze relatieve imports → .ts/.tsx,
// zoals de bundler van Next. Node strippt de TypeScript-types zelf (Node 23.6+).
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));

export async function resolve(spec, ctx, next) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".") && ctx.parentURL?.startsWith("file:")) base = path.resolve(path.dirname(fileURLToPath(ctx.parentURL)), spec);
  if (base) {
    for (const c of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
      if (existsSync(c) && statSync(c).isFile()) return next(pathToFileURL(c).href, ctx);
    }
  }
  return next(spec, ctx);
}
