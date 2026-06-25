import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-head",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kincha — Kincir Challenge",
  description:
    "Pahami Rasa, Kelola Emosi, Wujudkan Remaja Tangguh Bersama Kincha!",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} h-full`}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fbfbf9] antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
