import type { Metadata } from "next";
import "./globals.css";
import HubLayout from "@/components/HubLayout";

export const metadata: Metadata = {
  title: "JobRack Knowledge Hub",
  description: "SOPs and process guides for the JobRack team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <HubLayout>{children}</HubLayout>
      </body>
    </html>
  );
}
