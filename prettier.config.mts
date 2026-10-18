import { type PluginConfig as SortImportsConfig } from "@ianvs/prettier-plugin-sort-imports"
import { type Config as PrettierConfig } from "prettier"
import { type PluginOptions as AstroConfig } from "prettier-plugin-astro"
import { type PluginOptions as TailwindConfig } from "prettier-plugin-tailwindcss"

type Config = PrettierConfig & SortImportsConfig & AstroConfig & TailwindConfig

export default {
	arrowParens: "avoid",
	semi: false,
	singleQuote: false,
	useTabs: true,
	plugins: [
		"@ianvs/prettier-plugin-sort-imports",
		"prettier-plugin-astro",
		"prettier-plugin-tailwindcss",
	],
	importOrder: ["<BUILTIN_MODULES>", "<THIRD_PARTY_MODULES>", "^~/", "^[./]"],
	overrides: [{ files: "*.astro", options: { parser: "astro" } }],
	tailwindStylesheet: "./src/styles/global.css",
} satisfies Config
