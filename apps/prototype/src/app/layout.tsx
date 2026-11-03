import type { Metadata, Viewport } from "next";
import { Fraunces, Poppins } from "next/font/google";
import { CartUiProvider } from "@/components/commerce/cart-ui";
import { VloeiendeAnkers } from "@/components/ui/vloeiende-ankers";
import { SITE } from "@/lib/site/config";
import { BEELD } from "@/data/beelden";
import "./globals.css";

// next/font host de fonts zelf mee in de build: geen runtime-request naar Google.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-poppins" });
const fraunces = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"], display: "swap", variable: "--font-fraunces" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Brunic Ninove — gordijnen op maat, behang, vasttapijt & tapijten", template: "%s · Brunic Ninove" },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    locale: "nl_BE",
    siteName: SITE.name,
    images: [{ url: `${BEELD.hero.src}&width=1200`, width: 1200, alt: BEELD.hero.alt }],
  },
  // Indexeren staat enkel aan op productie (SITE_INDEXEREN=1), zodat previews en de
  // dev-store-versie nooit in Google belanden.
  robots: process.env.SITE_INDEXEREN === "1" ? { index: true, follow: true } : { index: false, follow: false },
  icons: { icon: "/brand/mascotte.png", apple: "/brand/mascotte.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl-BE" className={`${poppins.variable} ${fraunces.variable}`}>
      <body>
        <VloeiendeAnkers />
        <CartUiProvider>{children}</CartUiProvider>
      </body>
    </html>
  );
}
