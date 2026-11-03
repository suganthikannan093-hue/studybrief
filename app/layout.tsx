import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyBrief – AI Research & Study Companion",
  description: "Paste a topic or notes, get a structured study brief. Powered by the BharatCode model API.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
