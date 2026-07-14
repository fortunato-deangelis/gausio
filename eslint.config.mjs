import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // I primitivi shadcn sono incapsulati dai componenti shared: le feature
    // e le pagine non possono importarli direttamente.
    files: ["src/features/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui/*"],
              message:
                "Importa da @/components/shared: i primitivi shadcn vanno wrappati o riesportati lì.",
            },
          ],
        },
      ],
    },
  },
  {
    // Codice generato dal CLI shadcn: non applichiamo le regole hooks più
    // recenti a file che non manteniamo a mano.
    files: ["src/components/ui/**/*.tsx", "src/hooks/use-mobile.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
