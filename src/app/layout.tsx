import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AudioPlayer
  from '@/components/AudioPlayer';

import {
  AudioPlayerProvider
} from '@/app/context/AudioPlayerContext';
import FetchInterceptor
    from "@/components/FetchInterceptor";

import SessionHeartbeat
    from "@/components/SessionHeartbeat";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bluestreams",
  description: "A personal media server frontend built with Next.js and Tailwind CSS.",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body>

        <FetchInterceptor />

        <SessionHeartbeat />

        <AudioPlayerProvider>

          <div className="h-screen flex flex-col">

            <main className="flex-1 overflow-y-auto">

              {children}

            </main>

            <AudioPlayer />

          </div>

        </AudioPlayerProvider>

      </body>
    </html>
  );
}
