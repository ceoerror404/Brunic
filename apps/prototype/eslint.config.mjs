import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next.js-aanbeveling (Core Web Vitals + TypeScript). Draaien: pnpm --filter @brunic/prototype lint
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Performance-hint van de React Compiler-regels, geen fout: de site zet bewust state in
      // een effect om browser-only gegevens na de hydratatie toe te passen (?variant=, localStorage,
      // schermbreedte). Zichtbaar als waarschuwing; herschrijven naar useSyncExternalStore kan later.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".data/**"]),
]);
