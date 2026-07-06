import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AudioPlayer
  from '@/components/AudioPlayer';

import {
  AudioPlayerProvider
} from '@/app/context/AudioPlayerContext';


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

        <AudioPlayerProvider>

          {children}

          <AudioPlayer />

        </AudioPlayerProvider>

      </body>

    </html>
  );
}
