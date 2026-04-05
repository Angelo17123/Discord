import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KINETIC NOIR | Panel de Eventos",
  description: "Panel de control para gestion de eventos y asaltos del bot de Discord",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}>
      <body className={`${inter.variable} ${spaceGrotesk.variable} bg-surface text-on-surface min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
