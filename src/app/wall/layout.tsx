import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "The wall",
  description: "Ready to escape peace and quiet? Welcome to Meditation from Hell, where relaxation goes to die.",
  viewport: {
    initialScale: 2.0
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body style={{margin:0, overflow: "hidden"}}>
      <canvas id="tileCanvas" style={{display:"block"}}></canvas>
      {children}
      <Script src="/projects/wall/script.js"></Script>
      </body>
    </html>
  );
}
