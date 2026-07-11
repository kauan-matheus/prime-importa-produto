import { absoluteUrl, api } from "@/services/api";
import type { PendingImage } from "@/types/image";

export const imagesService = {
  next: (afterId?: number) => api.get<PendingImage | null>(afterId ? `/images/next?after_id=${afterId}` : "/images/next"),
  contentUrl: (image: PendingImage) => absoluteUrl(image.content_url),
};
