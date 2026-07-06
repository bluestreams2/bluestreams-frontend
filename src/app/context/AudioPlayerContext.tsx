'use client';

import {
  createContext,
  useContext,
  useState
} from 'react';

const AudioPlayerContext =
  createContext<any>(null);

export function AudioPlayerProvider({
  children
}: {
  children: React.ReactNode;
}) {

  const [currentTrack, setCurrentTrack] =
    useState<any>(null);

  const [playlist, setPlaylist] =
    useState<any[]>([]);

 function normalize(track:any){

    return {
        ...track,
        id: track.id ?? track.mediaId
    };

}

function playTrack(track: any, tracks: any[] = []) {

    console.log("PLAYTRACK CALLED");
    console.log(track);

    setCurrentTrack(track);

    if (tracks.length > 0) {
        setPlaylist(tracks);
    }
}

  function nextTrack() {

      console.log(
        'CURRENT',
        currentTrack
      );

      console.log(
        'PLAYLIST',
        playlist
      );

      if (!currentTrack) return;

      const index =
        playlist.findIndex(
          p => p.id === currentTrack.id
        );

      console.log(
        'INDEX',
        index
      );

      if (index === -1) return;

      const nextIndex =
        (index + 1) % playlist.length;

      setCurrentTrack(
        playlist[nextIndex]
      );
    }

  function previousTrack() {

    if (!currentTrack) return;

    const index =
      playlist.findIndex(
        p => p.id === currentTrack.id
      );

    if (index > 0) {

      setCurrentTrack(
        playlist[index - 1]
      );
    }
  }

  function syncToIndex(index:number){

      if(
          index < 0 ||
          index >= playlist.length
      ){
          return;
      }

      setCurrentTrack(
          playlist[index]
      );

  }

  function setQueue(
      tracks:any[],
      startIndex:number
  ){

      setPlaylist(tracks);

      setCurrentTrack(
          tracks[startIndex]
      );

  }

  return (

    <AudioPlayerContext.Provider
    value={{
        currentTrack,
        playlist,
        playTrack,
        nextTrack,
        previousTrack,
        syncToIndex,
        setCurrentTrack,
        setPlaylist,
        setQueue
    }}>

      {children}

    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {

  return useContext(
    AudioPlayerContext
  );
}