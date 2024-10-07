import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Andrei.fun",
  description: "A whimsical collection of side projects born from silly ideas—some serious, some just for fun!",
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
