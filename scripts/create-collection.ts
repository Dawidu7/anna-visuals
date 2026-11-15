import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import { extname, join } from "node:path"
import sharp from "sharp"

type ImageMetadata = {
	name: string
	sources: string[]
	tags: Set<string>
}

const IMAGE_EXT = new Set([".jpg", ".tif"])

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
			if (!file.isFile() || !IMAGE_EXT.has(extname(file.name).toLowerCase()))
				continue

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

	for (const [hash, meta] of images) {
		const id = hash.slice(0, 12)
		const filename = `${id}.webp`

		await sharp(meta.sources[0])
			.rotate()
			.resize({ width: 2400, withoutEnlargement: true })
			.webp({ quality: 82 })
			.toFile(join(imagesDir, filename))

		entries.push({
			id,
			name: meta.name,
			hash,
			src: `./assets/images/collection/${filename}`,
			tags: [...meta.tags],
		})
	}

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
