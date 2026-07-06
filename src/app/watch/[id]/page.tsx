'use client';

import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  useParams
} from 'next/navigation';

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export default function WatchPage() {

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

  const MEDIA_URL =
    process.env.NEXT_PUBLIC_MEDIA_URL;

  const params =
    useParams();

  const id =
    params.id;

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const saveTimerRef =
    useRef<NodeJS.Timeout | null>(
      null
    );

  const [media, setMedia] =
    useState<any>(null);

  const [resumePosition, setResumePosition] =
    useState(0);

  useEffect(() => {

    if (!id) {
      return;
    }

    fetch(
      `${API_URL}/media/${id}`
    )
      .then((res) => res.json())
      .then(setMedia)
      .catch(console.error);

  }, [id]);

  useEffect(() => {

    if (!id) {
      return;
    }

    const profileId =
      localStorage.getItem(
        'profileId'
      );

    if (!profileId) {
      return;
    }

    fetch(
      `${API_URL}/history/resume/${id}`,
      {
        headers: {
          'X-Profile-Id':
            profileId
        }
      }
    )
      .then(async (res) => {

        if (!res.ok) {
          return null;
        }

        const text =
          await res.text();

        if (!text) {
          return null;
        }

        return JSON.parse(text);
      })
      .then((history) => {

        if (
          history &&
          history.positionSeconds
        ) {

          setResumePosition(
            history.positionSeconds
          );

        }

      })
      .catch(console.error);

  }, [id]);

  useEffect(() => {

    if (!media) {
      return;
    }

    let player: any = null;
    let ui: any = null;

    const loadPlayer = async () => {

      if (
        !videoRef.current ||
        !containerRef.current
      ) {
        return;
      }

      const shaka = await import(
        'shaka-player/dist/shaka-player.ui.js'
      );

      await import(
        'shaka-player/dist/controls.css'
      );

      shaka.default.polyfill.installAll();

      if (
        !shaka.default.Player
          .isBrowserSupported()
      ) {

        console.error(
          'Browser not supported'
        );

        return;
      }

      player =
        new shaka.default.Player();

      await player.attach(
        videoRef.current
      );

      ui =
        new shaka.default.ui.Overlay(
          player,
          containerRef.current,
          videoRef.current
        );

      ui.configure({

        controlPanelElements: [
          'play_pause',
          'time_and_duration',
          'spacer',
          'mute',
          'volume',
          'fullscreen',
          'overflow_menu'
        ],

        overflowMenuButtons: [
          'quality',
          'language',
          'captions',
          'playback_rate'
        ]

      });

      await player.load(
        media.manifestUrl
      );

      if (Capacitor.isNativePlatform()) {

        videoRef.current?.addEventListener(
          'fullscreenchange',
          async () => {

            if (document.fullscreenElement) {

              await StatusBar.hide();

            } else {

              await StatusBar.show();
              await StatusBar.setStyle({
                style: Style.Dark
              });

            }

          }
        );

      }

      console.log(
        'DASH LOADED'
      );

      if (
        resumePosition > 10 &&
        videoRef.current
      ) {

        videoRef.current.addEventListener(
          'loadedmetadata',

          () => {

            if (
              videoRef.current
            ) {

              console.log(
                'RESUMING AT',
                resumePosition
              );

              videoRef.current.currentTime =
                resumePosition;

            }

          },

          { once: true }
        );
      }

      if (
        resumePosition > 10 &&
        videoRef.current
      ) {

        videoRef.current.addEventListener(
          'loadedmetadata',
          () => {

            if (
              videoRef.current
            ) {

              videoRef.current.currentTime =
                resumePosition;

            }

          },
          { once: true }
        );

      }

      try {

        const subtitleResponse =
          await fetch(
            `${API_URL}/subtitles/${encodeURIComponent(
              media.folderName
            )}/list`
          );

        if (
          subtitleResponse.ok
        ) {
          console.log(
            'SUBTITLE LIST STATUS',
            subtitleResponse.status
          );

          const subtitles =
            await subtitleResponse.json();

          for (
            const subtitle
            of subtitles
          ) {

            const subtitleUrl =
              `${MEDIA_URL}/subtitles/${encodeURIComponent(
                media.folderName
              )}/${subtitle.file}`;


            console.log(
              'LOADING SUBTITLE:',
              subtitleUrl
            );

            const test =
              await fetch(subtitleUrl);

            console.log(
              'SUBTITLE HTTP',
              test.status,
              subtitleUrl
            );

            await player.addTextTrackAsync(

              subtitleUrl,

              subtitle.lang || 'und',

              'subtitles',

              'text/vtt',

              '',

              subtitle.label

            );
          }
        }

      } catch (err) {

        console.error(err);

      }

      const profileId =
        localStorage.getItem(
          'profileId'
        );

      if (
        profileId &&
        videoRef.current
      ) {

        saveTimerRef.current =
          setInterval(async () => {

            if (
              !videoRef.current
            ) {
              return;
            }

            const current =
              Math.floor(
                videoRef.current.currentTime
              );

            const duration =
              Math.floor(
                videoRef.current.duration || 0
              );

            const completed =
              duration > 0 &&
              current >= duration * 0.95;

            try {

              await fetch(
                `${API_URL}/history`,
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
                      media.id,

                    positionSeconds:
                      current,

                    completed

                  })
                }
              );

            } catch (err) {

              console.error(
                err
              );

            }

          }, 10000);
      }
    };

    loadPlayer();

    return () => {

      if (
        saveTimerRef.current
      ) {

        clearInterval(
          saveTimerRef.current
        );

      }

      if (player) {

        player.destroy();

      }

      if (ui) {

        ui.destroy();

      }
    };

  }, [
    media,
    resumePosition
  ]);

  if (!media) {

    return (

      <div
        className="
          bg-black
          text-white
          min-h-screen
          flex
          items-center
          justify-center
        "
      >
        Loading...
      </div>

    );
  }

  return (

    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: 'black'
      }}
    >

      <video
        ref={videoRef}
        autoPlay
        controls
        playsInline={false}
        webkit-playsinline="false"
        style={{
          width: '100%',
          height: '100%'
        }}
        onDoubleClick={() => {

          const video =
            videoRef.current;

          if (!video) {
            return;
          }

          if (
            !document.fullscreenElement
          ) {

            video.requestFullscreen?.();

          } else {

            document.exitFullscreen?.();

          }

        }}
      />

    </div>
  );
}