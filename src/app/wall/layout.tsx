import Script from "next/script";

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
