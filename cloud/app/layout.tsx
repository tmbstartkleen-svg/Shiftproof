import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShiftProof ONE Cloud",
  description: "Plant intelligence for production, sanitation, quality and maintenance"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}