import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { areas, isSetUp, osName } from "@/lib/os";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: osName(), description: "Your life as plain files, one voice that reads them once a day." };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const setUp = isSetUp();
  return (
    <html lang="en">
      <body>
        <Nav name={osName()} areas={areas()} setUp={setUp} />
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
