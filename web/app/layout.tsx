import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emotion Insight",
  description: "Demo UI for a fine-tuned GoEmotions multi-label model.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
