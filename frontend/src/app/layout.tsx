import type { Metadata } from "next";
import { Inter, Exo_2, Raleway } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Providers } from "./providers";
import ToasterClient from "../components/ToasterClient";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const exo2 = Exo_2({ subsets: ["latin"], variable: "--font-exo2" });
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });

export const metadata: Metadata = {
  title: "KK360 Platform",
  description: "Comprehensive tutoring management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${raleway.variable} ${exo2.variable} font-sans`}>
        {/* Place Toaster inside Providers so it has access to any context */}
        <Providers>
          {children}
          <ToasterClient />
        </Providers>
      </body>
    </html>
  );
}
