import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyBrief – Notes to lasting recall",
  description: "Source-linked practice, confidence checks and a personal review queue. Powered by the BharatCode model API.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
