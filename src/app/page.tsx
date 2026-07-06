'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import MediaCard from '@/components/MediaCard';
import Navbar from '@/components/Navbar';

export default function Home() {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const router = useRouter();

  const [rows, setRows] =
    useState<any[]>([]);

  const [continueWatching, setContinueWatching] =
    useState<any[]>([]);

  useEffect(() => {
    const token =
      localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    const profileId =
      localStorage.getItem('profileId');

    if (!profileId) {
      router.push('/profiles');
    }
  }, [router]);

  useEffect(() => {
    fetch(`${API_URL}/media/home`)
      .then((res) => res.json())
      .then((data) => {

        setRows(
          Array.isArray(data)
            ? data
            : data.rows || []
        );

      })
      .catch(console.error);
  }, [API_URL]);

  useEffect(() => {
    const profileId =
      localStorage.getItem(
        'profileId'
      );

    if (!profileId) {
      return;
    }

    fetch(
      `${API_URL}/history/continue`,
      {
        headers: {
          'X-Profile-Id':
            profileId
        }
      }
    )
      .then((res) => res.json())
      .then(setContinueWatching)
      .catch(console.error);

  }, [API_URL]);

  const hero =
    rows?.[0]?.items?.[0];

  return (
    <main className="bg-[#050b18] text-white min-h-screen">

      <Navbar />

      {hero && (
        <section
          className="
            relative
            h-[85vh]
            bg-cover
            bg-center
            flex
            items-end
            px-16
            pb-20
            pt-28
          "
          style={{
            backgroundImage: `url(${
              hero.poster !== 'N/A'
                ? hero.poster
                : hero.thumbnailUrl
            })`
          }}
        >
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-[#050b18]
              via-[#050b18]/70
              to-transparent
            "
          />

          <div
            className="
              relative
              z-10
              max-w-2xl
            "
          >
            <h1
              className="
                text-6xl
                md:text-7xl
                font-bold
                mb-6
              "
            >
              {hero.title}
            </h1>

            <p
              className="
                text-xl
                text-zinc-200
                mb-8
                line-clamp-4
              "
            >
              {hero.overview}
            </p>

            <div className="flex gap-4">

              <a
                href={`/watch/${hero.id}`}
                className="
                  bg-white
                  text-black
                  px-8
                  py-3
                  rounded-xl
                  font-semibold
                  hover:bg-zinc-300
                "
              >
                ▶ Play
              </a>

              <a
                href={`/title/${hero.id}`}
                className="
                  bg-zinc-700/80
                  px-8
                  py-3
                  rounded-xl
                  font-semibold
                  hover:bg-zinc-600
                "
              >
                More Info
              </a>

            </div>
          </div>
        </section>
      )}

      {continueWatching.length > 0 && (
        <section className="px-10 mt-8 mb-12">

          <h2
            className="
              text-2xl
              font-bold
              mb-4
            "
          >
            Continue Watching
          </h2>

          <div
            className="
              flex
              gap-4
              overflow-x-auto
              pb-4
            "
          >
            {continueWatching.map(
              (item: any) => (
                <a
                  key={item.mediaId}
                  href={`/watch/${item.mediaId}`}
                  className="
                    min-w-[250px]
                    hover:scale-105
                    transition
                  "
                >

                  <img
                    src={item.poster}
                    alt={item.title}
                    className="
                      rounded-xl
                      w-full
                      h-[140px]
                      object-cover
                    "
                  />

                  <div className="mt-2">

                    <p
                      className="
                        text-white
                        font-semibold
                      "
                    >
                      {item.title}
                    </p>

                    <p
                      className="
                        text-zinc-400
                        text-sm
                      "
                    >
                      {Math.floor(
                        item.positionSeconds / 60
                      )}{' '}
                      min watched
                    </p>

                  </div>

                </a>
              )
            )}
          </div>

        </section>
      )}

      <div
        className="
          px-10
          py-10
          space-y-14
        "
      >

        {rows.map((row) => (
          <section
            key={row.title}
          >

            <h2
              className="
                text-3xl
                font-bold
                mb-6
              "
            >
              {row.title}
            </h2>

            <div
              className="
                flex
                gap-5
                overflow-x-auto
                pb-4
                scrollbar-hide
              "
            >

              {row.items?.map(
                (item: any) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                  />
                )
              )}

            </div>

          </section>
        ))}

      </div>

    </main>
  );
}