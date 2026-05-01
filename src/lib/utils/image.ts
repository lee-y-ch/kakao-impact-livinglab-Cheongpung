/**
 * 브라우저 전용 이미지 전처리.
 *
 * - EXIF orientation 자동 보정 (`createImageBitmap({ imageOrientation: "from-image" })`)
 * - 긴 변 기준 MAX_DIMENSION 로 축소
 * - JPEG 0.82 품질로 인코딩 (webp 브라우저 지원 편차 회피)
 *
 * Supabase Free tier 용량을 고려해 업로드 전 반드시 통과.
 */

export const MAX_DIMENSION = 1024;
export const OUTPUT_MIME = "image/jpeg" as const;
export const OUTPUT_QUALITY = 0.82;
export const MAX_INPUT_BYTES = 20 * 1024 * 1024; // 20MB 초과는 바로 거부

export type PreparedImage = {
  blob: Blob;
  width: number;
  height: number;
  extension: "jpg";
};

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) {
    throw new ImageProcessError("이미지 파일만 첨부할 수 있어요.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageProcessError("20MB 이하의 사진만 첨부할 수 있어요.");
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  }).catch(() => {
    throw new ImageProcessError("사진을 불러오지 못했어요.");
  });

  try {
    const { width, height } = scaleToFit(
      bitmap.width,
      bitmap.height,
      MAX_DIMENSION
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new ImageProcessError("브라우저가 이미지 처리를 지원하지 않아요.");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, OUTPUT_MIME, OUTPUT_QUALITY)
    );
    if (!blob) {
      throw new ImageProcessError("사진 변환에 실패했어요.");
    }

    return { blob, width, height, extension: "jpg" };
  } finally {
    bitmap.close?.();
  }
}

function scaleToFit(
  srcWidth: number,
  srcHeight: number,
  maxSide: number
): { width: number; height: number } {
  const longest = Math.max(srcWidth, srcHeight);
  if (longest <= maxSide) {
    return { width: srcWidth, height: srcHeight };
  }
  const ratio = maxSide / longest;
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
  };
}

export class ImageProcessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessError";
  }
}
