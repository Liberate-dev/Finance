import type { Metadata } from "next";
import "./globals.css";
import AppProvider from "@/components/AppProvider";

export const metadata: Metadata = {
  title: "FinTrack - Personal Finance Manager",
  description: "Kelola keuangan pribadi dengan mudah. Track pengeluaran, atur budget, scan struk, dan pantau tagihan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
