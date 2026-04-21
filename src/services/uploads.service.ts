import { api } from "@/lib/api";

export interface UploadResponse {
  url: string;
  publicId: string;
  folder?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  originalFilename?: string;
  business?: {
    id: string;
    slug: string;
    name: string;
  };
}

export const uploadsService = {
  uploadImage: (file: File) =>
    api.upload<UploadResponse>("/uploads/image", file, "file"),

  deleteImage: (publicId: string) =>
    api.delete("/uploads/image", {
      body: JSON.stringify({ publicId }),
    }),
};