import { api } from "@/lib/api";
import imageCompression from "browser-image-compression";

export interface UploadResponse {
  url: string;
  publicId: string;
  folder?: string;
  width?: number;
  height?: number;
  format?: string | null;
  bytes?: number;
  originalFilename?: string;
  fileName?: string;
  mimeType?: string;
  uploadedAt?: string;
  business?: {
    id: string;
    slug: string;
    name: string;
  };
}

const MAX_ORIGINAL_IMAGE_SIZE_MB = 10;
const MAX_FINAL_IMAGE_SIZE_MB = 0.95;
const MAX_FINAL_IMAGE_SIZE_BYTES = MAX_FINAL_IMAGE_SIZE_MB * 1024 * 1024;

const MAX_DOCUMENT_SIZE_MB = 10;

function getFileSizeMb(file: Blob) {
  return file.size / 1024 / 1024;
}

function getJpgFileName(fileName: string) {
  const cleanName = fileName.trim() || "imagen";
  return cleanName.replace(/\.[^/.]+$/, "") + ".jpg";
}

async function compressImageUnder1MB(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }

  const originalSizeMb = getFileSizeMb(file);

  if (originalSizeMb > MAX_ORIGINAL_IMAGE_SIZE_MB) {
    throw new Error(
      `La imagen original es demasiado pesada. Máximo permitido: ${MAX_ORIGINAL_IMAGE_SIZE_MB}MB.`,
    );
  }

  const attempts = [
    { maxWidthOrHeight: 1920, initialQuality: 0.82 },
    { maxWidthOrHeight: 1600, initialQuality: 0.76 },
    { maxWidthOrHeight: 1280, initialQuality: 0.7 },
    { maxWidthOrHeight: 1080, initialQuality: 0.64 },
    { maxWidthOrHeight: 900, initialQuality: 0.58 },
    { maxWidthOrHeight: 720, initialQuality: 0.52 },
    { maxWidthOrHeight: 640, initialQuality: 0.46 },
  ];

  let lastCompressedFile: File | null = null;

  for (const attempt of attempts) {
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: MAX_FINAL_IMAGE_SIZE_MB,
      maxWidthOrHeight: attempt.maxWidthOrHeight,
      useWebWorker: true,
      initialQuality: attempt.initialQuality,
      fileType: "image/jpeg",
      alwaysKeepResolution: false,
    });

    const compressedFile = new File(
      [compressedBlob],
      getJpgFileName(file.name),
      {
        type: "image/jpeg",
        lastModified: Date.now(),
      },
    );

    lastCompressedFile = compressedFile;

    if (compressedFile.size <= MAX_FINAL_IMAGE_SIZE_BYTES) {
      return compressedFile;
    }
  }

  if (lastCompressedFile && lastCompressedFile.size <= MAX_FINAL_IMAGE_SIZE_BYTES) {
    return lastCompressedFile;
  }

  throw new Error(
    "No se pudo reducir la imagen por debajo de 1MB. Probá con una imagen de menor resolución.",
  );
}

function validateDocument(file: File) {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Solo se permiten documentos PDF, JPG, PNG o WEBP.");
  }

  if (getFileSizeMb(file) > MAX_DOCUMENT_SIZE_MB) {
    throw new Error(`El documento no puede superar los ${MAX_DOCUMENT_SIZE_MB}MB.`);
  }
}

export const uploadsService = {
  uploadImage: async (file: File) => {
    const compressedFile = await compressImageUnder1MB(file);

    return api.upload<UploadResponse>(
      "/uploads/image",
      compressedFile,
      "file",
    );
  },

  uploadDocument: async (file: File) => {
    validateDocument(file);

    return api.upload<UploadResponse>(
      "/uploads/document",
      file,
      "file",
    );
  },

  deleteImage: (publicId: string) =>
    api.delete("/uploads/image", {
      body: JSON.stringify({ publicId }),
    }),

  deleteDocument: (publicId: string) =>
    api.delete("/uploads/document", {
      body: JSON.stringify({ publicId }),
    }),
};