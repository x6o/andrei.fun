import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Sort visualizer",
  description: "Sorting visualizer"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body>
      {children}
      </body>
    </html>
  );
}
