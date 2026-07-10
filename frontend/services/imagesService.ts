import { absoluteUrl, api } from "@/services/api";
import type { PendingImage } from "@/types/image";

export const imagesService = {
  next: () => api.get<PendingImage | null>("/images/next"),
  contentUrl: (image: PendingImage) => absoluteUrl(image.content_url),
};
