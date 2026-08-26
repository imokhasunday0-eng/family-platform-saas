import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Family Platform",
  description: "Your family's all-in-one platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
  
      <body className="antialiased">{children}</body>
    </html>
  );
}

