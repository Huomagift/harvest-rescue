import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harvest Rescue AI — Early Risk Warning System for Farmers",
  description:
    "Monitor crop-loss risk on farms using real-time weather and satellite NDVI data to protect yield before disaster strikes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FBFDFA] text-[#191C1A]">
        {children}
        
      <script src="https://widget.swiftagents.org/dist/widget-ui.js" data-company-id="cea89680-7ec8-45e7-bc2d-9e6a319d6740" data-api-key="swa_live_fa87fa96ced619214ccda33b66807dac15f4073df57c89d18538186094b9fc88" defer></script>
      </body>
    </html>
  );
}