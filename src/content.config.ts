import { defineCollection } from "astro:content"
import { file } from "astro/loaders"
import { z } from "astro/zod"

export const images = defineCollection({
	loader: file("src/collection.json"),
	schema: ({ image }) =>
		z.object({
			id: z.string(),
			name: z.string(),
			hash: z.string(),
			src: image(),
			alt: z.string().default(""),
			tags: z.array(z.string()),
		}),
})

export const collections = { images }
