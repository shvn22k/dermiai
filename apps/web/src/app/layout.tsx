import type { Metadata, Viewport } from "next";
import { Fustat, Newsreader, Poppins } from "next/font/google";
import { DemoChrome } from "@/demo/chrome";

import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-newsreader",
});
const fustat = Fustat({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-fustat" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: { default: "DermiAI", template: "%s · DermiAI" },
  description: "A calm skin-health companion. Dermi supports, not replaces, a dermatologist.",
};

export const viewport: Viewport = { themeColor: "#F5EEDD" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${fustat.variable} ${poppins.variable}`}
    >
      <body className="min-h-dvh">
        <DemoChrome />
        {children}
      </body>
    </html>
  );
}
