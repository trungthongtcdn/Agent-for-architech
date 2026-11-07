import type { Metadata, Viewport } from "next";
import "./globals.css";

const name = process.env.NEXT_PUBLIC_APP_NAME || "ArchRender";

export const metadata: Metadata = {
  title: { default: `${name} — AI render kiến trúc & bất động sản`, template: `%s · ${name}` },
  description: "Render phối cảnh từ phác thảo/SketchUp, bày nội thất ảo, upscale 4K và tạo video bất động sản bằng AI.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f4ef",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
