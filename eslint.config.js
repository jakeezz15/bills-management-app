const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

/** Style props whose values must come from the type scale, not a literal. */
const SCALE_PROPS = "^(fontSize|lineHeight|borderRadius)$";

/** #abc, #abcd, #aabbcc, #aabbccdd */
const HEX_COLOR = "^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$";

module.exports = defineConfig([
    globalIgnores(["dist/*", "example/*", ".expo/*", "node_modules/*"]),
    expoConfig,

    {
        // Design-system enforcement. Keeps the token layer from eroding the way
        // the pre-refactor styles did: 13 font sizes, 13 radii, 38 stray hexes.
        files: ["src/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-syntax": [
                "error",
                {
                    selector: `Literal[value=/${HEX_COLOR}/]`,
                    message:
                        "No hex colours outside src/design/palette.ts. Use a semantic token from @/design (theme.text.*, theme.bg.*, theme.intent.*, theme.action.*).",
                },
                {
                    selector: `Property[key.name=/${SCALE_PROPS}/] > Literal`,
                    message:
                        "Use the scale: theme.fontSize.*, theme.lineHeight.*, theme.radius.* — or a named role from `text` in @/design.",
                },
            ],
            "no-restricted-imports": [
                "error",
                {
                    paths: [
                        {
                            name: "@/theme",
                            message:
                                "Removed. Import { theme, text, elevation } from '@/design'.",
                        },
                        {
                            name: "@/styles/modal-form",
                            message:
                                "Removed. Import { form, formColors } from '@/styles/form'.",
                        },
                    ],
                    patterns: [
                        {
                            group: ["**/design/palette", "@/design/palette"],
                            message:
                                "Raw ramps are private to the design layer. Consume semantic tokens from @/design instead.",
                        },
                    ],
                },
            ],
        },
    },

    {
        // The one place raw colour values are the whole point.
        files: ["src/design/palette.ts"],
        rules: { "no-restricted-syntax": "off" },
    },
    {
        // Defines the scale, so it must state the numbers literally.
        files: ["src/design/tokens.ts", "src/design/typography.ts"],
        rules: {
            "no-restricted-syntax": "off",
            "no-restricted-imports": "off",
        },
    },
]);
