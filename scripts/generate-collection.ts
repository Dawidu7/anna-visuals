import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import { join } from "node:path"
import { isImage, optimize } from "./optimize-image"

type ImageMetadata = {
	name: string
	sources: string[]
	tags: Set<string>
}

async function scan(dirname: string) {
	const root = join(process.cwd(), dirname)

	const dirs = await fs.readdir(root, { withFileTypes: true })

	const images = new Map<string, ImageMetadata>()

	for (const dir of dirs.sort((a, b) => a.name.localeCompare(b.name))) {
		if (!dir.isDirectory()) continue

		const dirPath = join(root, dir.name)

		const files = await fs.readdir(dirPath, {
			withFileTypes: true,
		})

		for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
			if (!file.isFile() || !isImage(file.name)) continue

			const source = join(dirPath, file.name)

			const buffer = await fs.readFile(source)
			const hash = createHash("sha256").update(buffer).digest("hex")

			const existing = images.get(hash)
			if (existing) {
				existing.sources.push(source)
				existing.tags.add(dir.name)
			} else {
				images.set(hash, {
					name: file.name,
					sources: [source],
					tags: new Set([dir.name]),
				})
			}
		}
	}

	return images
}

async function write(images: Map<string, ImageMetadata>) {
	const imagesDir = join(process.cwd(), "src", "assets", "images", "collection")
	await fs.rm(imagesDir, { recursive: true, force: true })
	await fs.mkdir(imagesDir, { recursive: true })

	const entries = []
	let current = 0

	for (const [hash, meta] of images) {
		const id = hash.slice(0, 12)
		const filename = `${id}.webp`

		current++
		process.stdout.write(`\r\x1b[2K[${current}/${images.size}] ${meta.name}`)

		const placeholder = await optimize(
			meta.sources[0],
			join(imagesDir, filename),
			2400,
			82,
		)

		entries.push({
			id,
			name: meta.name,
			hash,
			src: `./assets/images/collection/${filename}`,
			placeholder: `data:image/webp;base64,${placeholder.toString("base64")}`,
			tags: [...meta.tags],
		})
	}
	process.stdout.write("\x1b[2K")

	if (new Set(entries.map(e => e.id)).size !== entries.length)
		throw new Error("Hash collision")

	entries.sort((a, b) => a.name.localeCompare(b.name))

	await fs.writeFile(
		join(process.cwd(), "src", "collection.json"),
		JSON.stringify(entries, null, 2) + "\n",
	)
}

try {
	const images = await scan("images")
	await write(images)
} catch (error) {
	console.error(`Something went wrong: ${error}`)
	process.exit(1)
}
