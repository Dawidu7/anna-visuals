export type Service = {
	id: string
	title: string
	subtitle: string
	text: string
	thumbnail: ImageMetadata | null
	images: { src: ImageMetadata; alt: string }[] | null
}
