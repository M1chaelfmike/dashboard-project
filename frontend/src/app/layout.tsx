import type { Metadata } from "next";
import type {ReactNode} from "react";
import { Geist, Geist_Mono } from "next/font/google";
import {AppRouterCacheProvider} from "@mui/material-nextjs/v16-appRouter";

import InitColorSchemeScript  from "@mui/material/InitColorSchemeScript";

import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard Project",
  description: "Supply Chain Tracking Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body>
        <InitColorSchemeScript
          defaultMode="system"
          attribute="class"
        />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}