import { api } from "@/lib/api";

export interface UploadResponse {
  url: string;
  publicId?: string;
}

export const uploadsService = {
  uploadImage: (file: File) => api.upload<UploadResponse>("/uploads/image", file, "image"),
  deleteImage: (url: string) => api.delete(`/uploads/image?url=${encodeURIComponent(url)}`),
};
