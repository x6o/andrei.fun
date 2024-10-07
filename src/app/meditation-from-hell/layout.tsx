import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meditation from Hell",
  description: "Ready to escape peace and quiet? Welcome to Meditation from Hell, where relaxation goes to die.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
