import { absoluteUrl, api } from "@/services/api";
import type { PendingImage } from "@/types/image";

export const imagesService = {
  list: () => api.get<PendingImage[]>("/images"),
  contentUrl: (image: { content_url: string }, size?: number) =>
    absoluteUrl(size ? `${image.content_url}?size=${size}` : image.content_url),
};
