import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import sharp from "sharp"

const EXT = new Set([".jpg", ".tif"])

export const isImage = (name: string) =>
	EXT.has(path.extname(name).toLowerCase())

export async function optimize(
	src: string,
	out: string,
	width: number,
	quality: number,
) {
	await sharp(src)
		.rotate()
		.resize({ width, withoutEnlargement: true })
		.webp({ quality })
		.toFile(out)
}

async function getFiles(target: string) {
	const stat = await fs.stat(target)

	if (stat.isFile()) return isImage(target) ? [target] : []
	if (!stat.isDirectory()) return []

	return (await fs.readdir(target, { withFileTypes: true }))
		.filter(file => file.isFile() && isImage(file.name))
		.map(file => path.join(target, file.name))
}

async function main() {
	const { positionals, values } = parseArgs({
		allowPositionals: true,
		options: {
			out: { type: "string", short: "o" },
			width: { type: "string", short: "w", default: "2400" },
			quality: { type: "string", short: "q", default: "82" },
		},
	})
	const width = Number(values.width)
	const quality = Number(values.quality)

	if (values.out) await fs.mkdir(values.out, { recursive: true })

	for (const target of positionals) {
		for (const file of await getFiles(target)) {
			const out = path.join(
				values.out ?? path.dirname(file),
				`${path.parse(file).name}.webp`,
			)
			await optimize(file, out, width, quality)
		}
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
