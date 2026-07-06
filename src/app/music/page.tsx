'use client';

import { useEffect, useState } from 'react';

import Navbar from '@/components/Navbar';

import {
  useAudioPlayer
} from '@/app/context/AudioPlayerContext';

export default function MusicPage() {

  const [recent, setRecent] = useState<any[]>([]);
  const [repeat, setRepeat] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const {
    playTrack
  } = useAudioPlayer();

  const [library, setLibrary] =
    useState<any>(null);

  const [selectedArtist, setSelectedArtist] =
    useState<any>(null);

  const [selectedAlbum, setSelectedAlbum] =
    useState<any>(null);

  const [filter, setFilter] =
    useState('');

useEffect(() => {

    const token =
        localStorage.getItem(
        'token'
        );

    if (!token) {

        window.location.href =
        '/login';

        return;
    }

    const profileId =
        localStorage.getItem(
        'profileId'
        );

    if (!profileId) {

        window.location.href =
        '/profiles';

        return;
    }

    }, []);

  useEffect(() => {

    const token = localStorage.getItem("token");
    const profileId = localStorage.getItem("profileId");

    const headers = {
        Authorization: `Bearer ${token}`,
        "X-Profile-Id": profileId!
    };
    

    fetch(`${API_URL}/music/history/recent`, { headers })
        .then(r => r.json())
        .then(setRecent);

    fetch(`${API_URL}/music/history/repeat`, { headers })
        .then(r => r.json())
        .then(setRepeat);

    fetch(`${API_URL}/music/history/top`, { headers })
        .then(r => r.json())
        .then(setTop);

    // const token =
    // localStorage.getItem(
    //     'token'
    // );

    fetch(
    `${API_URL}/music/library`,
    {
        headers: {
        Authorization:
            `Bearer ${token}`
        }
    }
    )
      .then(res => res.json())
      .then(data => {

        setLibrary(data);

        if (
          data.artists &&
          data.artists.length > 0
        ) {

          setSelectedArtist(
            data.artists[0]
          );

          if (
            data.artists[0].albums &&
            data.artists[0].albums.length > 0
          ) {

            setSelectedAlbum(
              data.artists[0].albums[0]
            );
          }
        }
      });

  }, []);

  return (

    <main className="
      bg-black
      text-white
      min-h-screen
    ">

      <Navbar />

      
      {/* PLAYLISTS */}

      <div className="mb-16">

        <h2 className="text-3xl font-bold mb-6">
          Your Music
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <a
            href="/music/recent"
            className="
              bg-zinc-900
              hover:bg-zinc-800
              rounded-2xl
              p-6
              transition
              group
            "
          >

            <div
              className="
                w-14
                h-14
                rounded-xl
                bg-blue-600
                flex
                items-center
                justify-center
                text-3xl
                mb-5
                group-hover:scale-110
                transition
              "
            >
              🕘
            </div>

            <h3 className="text-2xl font-bold">
              Recently Played
            </h3>

            <p className="text-zinc-400 mt-3">
              Songs you've listened to recently.
            </p>

          </a>

          <a
            href="/music/repeat"
            className="
              bg-zinc-900
              hover:bg-zinc-800
              rounded-2xl
              p-6
              transition
              group
            "
          >

            <div
              className="
                w-14
                h-14
                rounded-xl
                bg-green-600
                flex
                items-center
                justify-center
                text-3xl
                mb-5
                group-hover:scale-110
                transition
              "
            >
              🔁
            </div>

            <h3 className="text-2xl font-bold">
              On Repeat
            </h3>

            <p className="text-zinc-400 mt-3">
              Songs you've been playing the most lately.
            </p>

          </a>

          <a
            href="/music/top"
            className="
              bg-zinc-900
              hover:bg-zinc-800
              rounded-2xl
              p-6
              transition
              group
            "
          >

            <div
              className="
                w-14
                h-14
                rounded-xl
                bg-red-600
                flex
                items-center
                justify-center
                text-3xl
                mb-5
                group-hover:scale-110
                transition
              "
            >
              ⭐
            </div>

            <h3 className="text-2xl font-bold">
              Most Played
            </h3>

            <p className="text-zinc-400 mt-3">
              Your all-time favorites.
            </p>

          </a>

        </div>

      </div>

      {/* MUSIC LIBRARY */}

      <h1
        className="
          text-5xl
          font-bold
          mb-8
        "
      >
        Music Library
      </h1>

      <input
        type="text"
        placeholder="Search artist..."
        value={filter}
        onChange={(e) =>
          setFilter(e.target.value)
        }
        className="
          w-full
          max-w-md
          bg-zinc-900
          border
          border-zinc-700
          rounded-xl
          p-3
          mb-8
        "
      />

      <div className="flex gap-8"></div>
      

      

        {/* <h1 className="
          text-5xl
          font-bold
          mb-8
        ">
          Music Library
        </h1>

        <input
          type="text"
          placeholder="Search artist..."
          value={filter}
          onChange={(e) =>
            setFilter(
              e.target.value
            )
          }
          className="
            w-full
            max-w-md
            bg-zinc-900
            border
            border-zinc-700
            rounded-xl
            p-3
            mb-8
          "
        /> */}

        <div className="
          flex
          gap-8
        ">

          {/* ARTISTS */}

          <div className="
            w-1/4
          ">

            <h2 className="
              text-2xl
              font-bold
              mb-4
            ">
              Artists
            </h2>

            <div className="
              space-y-2
              max-h-[75vh]
              overflow-y-auto
            ">

              {library?.artists
                ?.filter(
                  (artist: any) =>
                    artist.name
                      .toLowerCase()
                      .includes(
                        filter.toLowerCase()
                      )
                )
                .map(
                  (artist: any) => (

                  <button
                    key={artist.name}
                    onClick={() => {

                      setSelectedArtist(
                        artist
                      );

                      setSelectedAlbum(
                        artist.albums?.[0]
                      );
                    }}
                    className={`
                      w-full
                      text-left
                      p-3
                      rounded-xl
                      transition
                      ${
                        selectedArtist?.name === artist.name
                          ? 'bg-blue-600'
                          : 'bg-zinc-900 hover:bg-zinc-800'
                      }
                    `}
                  >

                    {artist.name}

                  </button>
              ))}
            </div>

          </div>

          {/* ALBUMS */}

          <div className="
            w-1/4
          ">

            <h2 className="
              text-2xl
              font-bold
              mb-4
            ">
              Albums
            </h2>

            <div className="
              space-y-3
              max-h-[75vh]
              overflow-y-auto
            ">

              {selectedArtist?.albums?.map(
                (album: any) => (

                <button
                  key={album.name}
                  onClick={() =>
                    setSelectedAlbum(
                      album
                    )
                  }
                  className={`
                    w-full
                    text-left
                    p-3
                    rounded-xl
                    transition
                    ${
                      selectedAlbum?.name === album.name
                        ? 'bg-blue-600'
                        : 'bg-zinc-900 hover:bg-zinc-800'
                    }
                  `}
                >

                  <div className="
                    flex
                    items-center
                    gap-3
                  ">

                    {album.artwork && (

                      <img
                        src={album.artwork}
                        alt={album.name}
                        className="
                          w-14
                          h-14
                          rounded-lg
                          object-cover
                        "
                      />

                    )}

                    <div>

                      <div className="
                        font-semibold
                      ">
                        {album.name}
                      </div>

                      <div className="
                        text-sm
                        text-zinc-300
                      ">
                        {album.tracks?.length}
                        {' '}
                        tracks
                      </div>

                    </div>

                  </div>

                </button>
              ))}
            </div>

          </div>

          {/* TRACKS */}

          <div className="
            flex-1
          ">

            <div className="
              flex
              items-center
              justify-between
              mb-6
            ">

              <h2 className="
                text-2xl
                font-bold
              ">
                Tracks
              </h2>

              {selectedAlbum && (

                <button
                  onClick={() =>
                    playTrack(
                      selectedAlbum.tracks[0],
                      selectedAlbum.tracks
                    )
                  }
                  className="
                    bg-green-600
                    hover:bg-green-500
                    px-5
                    py-2
                    rounded-xl
                    font-semibold
                  "
                >
                  ▶ Play Album
                </button>

              )}

            </div>

            <div className="
              space-y-2
              max-h-[75vh]
              overflow-y-auto
            ">

              {selectedAlbum?.tracks?.map(
                (track: any) => (

                <button
                  key={track.id}
                  onClick={() => {

                    console.log(
                      'CLICKED TRACK',
                      track
                    );

                    playTrack(
                      track,
                      selectedAlbum.tracks
                    );
                  }}
                  className="
                    w-full
                    flex
                    items-center
                    gap-4
                    bg-zinc-900
                    hover:bg-zinc-800
                    rounded-xl
                    p-3
                    transition
                  "
                >

                  <img
                    src={track.poster}
                    alt={track.title}
                    className="
                      w-16
                      h-16
                      object-cover
                      rounded-lg
                    "
                  />

                  <div className="
                    text-left
                    flex-1
                  ">

                    <div className="
                      font-semibold
                    ">
                      {track.trackNumber}.
                      {' '}
                      {track.title}
                    </div>

                    <div className="
                      text-zinc-400
                      text-sm
                    ">
                      {track.artist}
                    </div>

                  </div>

                  <div className="
                    text-zinc-500
                    text-sm
                  ">

                    {track.durationMs
                      ? `${Math.floor(
                          track.durationMs /
                          60000
                        )}:${String(
                          Math.floor(
                            (track.durationMs %
                              60000) /
                              1000
                          )
                        ).padStart(
                          2,
                          '0'
                        )}`
                      : ''
                    }

                  </div>

                </button>
              ))}
            </div>

          </div>

        </div>

     

    </main>
  );
}