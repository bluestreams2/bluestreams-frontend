'use client';

import {
  useCallback,
  useEffect,
  useRef
} from 'react';

import {
  Capacitor
} from '@capacitor/core';

import {
  useAudioPlayer
} from '@/app/context/AudioPlayerContext';

import {
  MediaControls
} from '@/app/lib/mediaControls';

export default function AudioPlayer() {

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const {
    currentTrack,
    playlist,
    nextTrack,
    previousTrack,
    syncToIndex,
    audioRef,
    closePlayer,
    showPlayer
  } = useAudioPlayer();

  const queuedPlaylistRef =
    useRef<any[] | null>(null);

  const isNative =
    Capacitor.isNativePlatform();
  
  const lastSavedPosition =
  useRef(0);

  const historyInterval =
  useRef<NodeJS.Timeout | null>(null);

  const saveHistory = useCallback(
    async (
      completed = false,
      track = currentTrack,
      forcedPosition?: number
    ) => {

      if (!track) {
        return;
      }

      const profileId =
        localStorage.getItem(
          'profileId'
        );

      if (!profileId) {
        return;
      }

      //let position = 0;

      let position =
        forcedPosition ??
        Math.floor(audioRef.current?.currentTime || 0);

      if (isNative) {

        try {

          const status =
            await MediaControls.getStatus();

          position =
            Math.floor(
              status.positionMs / 1000
            );

        } catch {

          position = 0;

        }

      } else {

        position =
          Math.floor(
            audioRef.current?.currentTime || 0
          );

      }

      const isForced =
          forcedPosition !== undefined;

      if (
          !isForced &&
          !completed &&
          position < 5
      ) {
          return;
      }
      console.log("TRACK OBJECT");
      console.log(track);
      console.log("TRACK ID", track.id);
      const body = {
          mediaId: track.id ?? track.mediaId,
          positionSeconds: position,
          completed
      };

      console.log("Sending history", body);

      fetch(
        `${API_URL}/music/history`,
        {

          method: 'POST',

          headers: {

            'Content-Type':
              'application/json',

            'X-Profile-Id':
              profileId

          },

          body: JSON.stringify({

            mediaId:
              track.id ?? track.mediaId,

            positionSeconds:
              position,

            completed

          })

        }

      ).catch(console.error);

    },
    [API_URL, currentTrack, isNative]
  );

  useEffect(() => {
    console.log("CURRENT TRACK");
    console.log(currentTrack);

    if (currentTrack) {
        console.log("id =", currentTrack.id);
        console.log("mediaId =", currentTrack.mediaId);
    }
  }, [currentTrack]);

  useEffect(() => {

    if (!isNative) {
      return;
    }

    const stateHandle =
      MediaControls.addListener(
        'playbackStateChanged',
        () => {}
      );

    const endedHandle =
      MediaControls.addListener(
        'trackEnded',
        async () => {
          console.log('NATIVE TRACK ENDED');
          await saveHistory(
              true,
              currentTrack,
              0
          );
        }
      );

    const changedHandle =
      MediaControls.addListener(
        'trackChanged',
        async (event) => {

          console.log(
            'NATIVE TRACK CHANGED',
            event.index
          );

          await saveHistory(
              false,
              currentTrack,
              0
          );
          syncToIndex(event.index);
        }
      );

    return () => {

      stateHandle.then(h => h.remove());
      endedHandle.then(h => h.remove());
      changedHandle.then(h => h.remove());

    };

  }, [isNative, syncToIndex]);

  useEffect(() => {

    if (
      !isNative ||
      !currentTrack ||
      playlist.length === 0
    ) {
      return;
    }

    if (queuedPlaylistRef.current === playlist) {
      return;
    }

    queuedPlaylistRef.current = playlist;

    const startIndex =
      Math.max(
        0,
        playlist.findIndex(
          (p: any) => p.id === (currentTrack.id ?? currentTrack.mediaId)
        )
      );

    const tracks =
      playlist.map((track: any) => ({
        url: `${API_URL}/music/stream/${track.id}`,
        title: track.title,
        artist: track.artist || '',
        album: track.album || '',
        artwork: track.poster
      }));

    MediaControls
      .setQueue({
        tracks,
        startIndex
      })
      .then(() => MediaControls.play())
      .catch(err =>
        console.error(
          'Native setQueue failed',
          err
        )
      );

  }, [
    isNative,
    playlist,
    currentTrack,
    API_URL
  ]);

  useEffect(() => {

    if (isNative) {
      return;
    }

    const audio =
      audioRef.current;

    if (
      !audio ||
      !currentTrack
    ) {
      return;
    }

    audio.pause();

    audio.src =
      `${API_URL}/music/stream/${currentTrack.id ?? currentTrack.mediaId}`;

    audio.load();

    audio.play()
      .catch(error => {

        if (
          error?.name !==
          'AbortError'
        ) {

          console.error(error);

        }

      });

    if (
      'mediaSession' in navigator
    ) {

      navigator.mediaSession.metadata =
        new MediaMetadata({

          title:
            currentTrack.title,

          artist:
            currentTrack.artist || '',

          album:
            currentTrack.album || '',

          artwork: [
            {
              src:
                currentTrack.poster,
              sizes:
                '512x512',
              type:
                'image/jpeg'
            }
          ]

        });

      navigator.mediaSession
        .setActionHandler(
          'play',
          () => audio.play()
        );

      navigator.mediaSession
        .setActionHandler(
          'pause',
          () => audio.pause()
        );

      navigator.mediaSession
        .setActionHandler(
          'nexttrack',
          nextTrack
        );

      navigator.mediaSession
        .setActionHandler(
          'previoustrack',
          previousTrack
        );

      navigator.mediaSession
        .setActionHandler(
          'seekforward',
          () => {

            audio.currentTime =
              Math.min(
                audio.duration,
                audio.currentTime + 10
              );

          }
        );

      navigator.mediaSession
        .setActionHandler(
          'seekbackward',
          () => {

            audio.currentTime =
              Math.max(
                0,
                audio.currentTime - 10
              );

          }
        );
    }

    const updatePosition = () => {

      if (
        'mediaSession' in navigator &&
        navigator.mediaSession
          .setPositionState
      ) {

        try {

          navigator.mediaSession
            .setPositionState({

              duration:
                audio.duration || 0,

              playbackRate:
                audio.playbackRate,

              position:
                audio.currentTime

            });

        } catch {}

      }

    };

    audio.addEventListener(
      'timeupdate',
      updatePosition
    );

    return () => {

      audio.removeEventListener(
        'timeupdate',
        updatePosition
      );

    };

  }, [
    isNative,
    currentTrack,
    nextTrack,
    previousTrack,
    API_URL
  ]);

  useEffect(() => {

    if (!currentTrack) {
      return;
    }

    if (historyInterval.current) {

      clearInterval(
        historyInterval.current
      );

    }

    lastSavedPosition.current = 0;

    historyInterval.current =
      setInterval(async () => {

        let seconds = 0;

        if (isNative) {

          try {

            const status =
              await MediaControls.getStatus();

            seconds =
              Math.floor(
                status.positionMs / 1000
              );

          } catch {

            return;

          }

        } else {

          seconds =
            Math.floor(
              audioRef.current?.currentTime || 0
            );

        }

        if (
          Math.abs(
            seconds -
            lastSavedPosition.current
          ) >= 10
        ) {

          lastSavedPosition.current =
            seconds;

          saveHistory(false);

        }

      }, 10000);

    return () => {

      if (
        historyInterval.current
      ) {

        clearInterval(
          historyInterval.current
        );

      }

      saveHistory(false);

    };

  }, [
    currentTrack,
    isNative
  ]);

  if (!showPlayer || !currentTrack) {
      return null;
  }

  

  function handlePlay() {

    if (isNative) {

      MediaControls.play()
        .catch(console.error);

    } else {

      audioRef.current
        ?.play()
        .catch(console.error);

    }
  }

  function handlePause() {

    if (isNative) {

      MediaControls.pause()
    .then(() => saveHistory(false))
    .catch(console.error);

    } else {

      audioRef.current?.pause();
      saveHistory(false);

    }
  }

  async function handleNext() {
     await saveHistory(
        false,
        currentTrack,
        0
    );

    if (isNative) {

      MediaControls.skipToNext()
        .catch(console.error);

    } else {

      nextTrack();

    }
  }

  async function handlePrevious() {

    await saveHistory(
        false,
        currentTrack,
        0
    );
    if (isNative) {

      MediaControls.skipToPrevious()
        .catch(console.error);

    } else {

      previousTrack();

    }
  }

  return (

    <div
      className="
        fixed
        bottom-0
        left-0
        right-0
        h-24
        bg-zinc-950
        border-t
        border-zinc-800
        flex
        items-center
        justify-between
        px-6
        z-[9999]
      "
    >

      <div
        className="
          flex
          items-center
          gap-4
        "
      >

        <img
          src={currentTrack.poster}
          className="
            w-14
            h-14
            rounded-lg
            object-cover
          "
        />

        <div>

          <p className="font-semibold">

            {currentTrack.title}

          </p>

          <p
            className="
              text-sm
              text-zinc-400
            "
          >

            {currentTrack.artist}

          </p>

        </div>

      </div>

      <div
        className="
          flex
          items-center
          gap-4
        "
      >

        <button onClick={handlePrevious}>⏮</button>
        <button onClick={handlePlay}>▶</button>
        <button onClick={handlePause}>⏸</button>
        <button onClick={handleNext}>⏭</button>

      </div>

      {!isNative && (

        <audio
          ref={audioRef}
          controls
          preload="metadata"
          crossOrigin="anonymous"
          onPause={async () => {
            await saveHistory(
                false,
                currentTrack,
                0
            );
          }}
          onEnded={async () => {

            console.log(
              'TRACK ENDED',
              currentTrack?.title
            );

            await saveHistory(
                true,
                currentTrack,
                0
            );

            nextTrack();

          }}
        />
      )}
      <button
            onClick={closePlayer}
            className="
                absolute
                top-4
                right-5
                text-2xl
                text-zinc-400
                hover:text-white
            "
        >
            ✕
        </button>

    </div>

  );
}