import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/ScrollToTop";
import AuthGlowCleanup from "@/components/AuthGlowCleanup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roche RFID KMS",
  description: "Key Management Service for RFID Operations",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Cookie serverseitig abfragen ("login", "logout" oder undefined)
  const cookieStore = await cookies();
  const flashEvent = cookieStore.get("auth_flash_event")?.value;

  const isLogin = flashEvent === "login";
  const isLogout = flashEvent === "logout";
  const hasFlash = isLogin || isLogout;

  return (
    <html lang="en" className="h-full antialiased dark">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden bg-slate-950 text-slate-100`}>
        {/* VIEWPORT-LOCKED CONTAINER (Kein externes Scrollen der Gesamtseite) */}
        <div className="h-screen w-full bg-slate-950 relative overflow-hidden flex flex-col">
          
          {/* BREITFÄCHERNDER LICHTKEGEL OBEN */}
          {hasFlash && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center animate-in fade-in duration-1000">
              <div
                className={`h-80 sm:h-96 w-full max-w-7xl blur-[100px] opacity-90 transition-all duration-1000 ${
                  isLogin
                    ? "bg-linear-to-b from-emerald-500/25 via-blue-500/15 to-transparent"
                    : "bg-linear-to-b from-rose-500/30 via-rose-900/15 to-transparent"
                }`}
              />
            </div>
          )}

          {/* MAIN SHELL: Feste Viewport-Höhe */}
          <div
            className={`relative mx-auto flex h-screen w-full max-w-275 flex-col border-x transition-all duration-1000 ${
              isLogin
                ? "border-emerald-500/50 bg-slate-900/60 shadow-[0_0_80px_-5px_rgba(16,185,129,0.3)]"
                : isLogout
                ? "border-rose-500/50 bg-slate-900/60 shadow-[0_0_80px_-5px_rgba(244,63,94,0.3)]"
                : "border-slate-800/80 bg-slate-900/50 shadow-2xl"
            }`}
          >
            {/* 1. Header oben verankert */}
            <Header />

            {/* 2. Nur diese Main-Area scrollt intern bei langem Content */}
            <main className="flex-1 overflow-y-auto px-4 pt-4 pb-6 sm:px-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {children}
            </main>

            {/* 3. Footer bleibt immer im Bild unten fixiert */}
            <Footer />
          </div>
        </div>

        <ScrollToTop />

        {/* Entfernt das Cookie nach 4 Sekunden */}
        {hasFlash && <AuthGlowCleanup />}
      </body>
    </html>
  );
}