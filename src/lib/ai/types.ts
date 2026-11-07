export type InlineImage = { mime: string; data: Buffer };

export type ImageSize = "1K" | "2K" | "4K";

export type ImageRequest = {
  model: string;
  prompt: string;
  images: InlineImage[];
  aspect: string;
  size: ImageSize;
};

export type ImageResult = { mime: string; data: Buffer };

export type VideoRequest = {
  model: string;
  prompt: string;
  image: InlineImage;
  aspect: "16:9" | "9:16";
  resolution: "360p" | "720p" | "1080p";
};

export type VideoStart = { state: "done"; mime: string; data: Buffer } | { state: "pending"; ref: string };
export type VideoPoll = VideoStart | { state: "failed"; error: string };

export interface AiProvider {
  name: string;
  generateImage(req: ImageRequest): Promise<ImageResult>;
  startVideo(req: VideoRequest): Promise<VideoStart>;
  pollVideo(ref: string): Promise<VideoPoll>;
}

/** Lỗi hiển thị được cho người dùng (đã dịch). retryable = lỗi tạm thời. */
export class AiError extends Error {
  constructor(message: string, public retryable = false, public detail?: string) {
    super(message);
  }
}
