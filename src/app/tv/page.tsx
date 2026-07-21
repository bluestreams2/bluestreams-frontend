'use client';

import { useEffect, useRef, useState } from 'react';
import { useMemo } from "react";
import Hls from 'hls.js';

import Navbar from '@/components/Navbar';

export default function TVPage() {

    const API_URL =
        process.env.NEXT_PUBLIC_API_URL;

    const videoRef =
        useRef<HTMLVideoElement>(null);

    const [providers, setProviders] =
        useState<any[]>([]);

    const [provider, setProvider] =
        useState<number>(0);

    const [channels, setChannels] =
        useState<any[]>([]);


    const [selected, setSelected] =
        useState<any>(null);

    const [search, setSearch] =
        useState('');
    
    const [loading, setLoading] = useState(false);

    const [groupFilter, setGroupFilter] = useState('All');

    const groups = useMemo(() => {

        return [
            "All",
            ...new Set(
                channels
                    .map(c => c.groupName?.trim())
                    .filter(Boolean)
            )
        ].sort();

    }, [channels]);

    const getLogo = (logo?: string) => {

        if (!logo)
            return '/tv-placeholder.png';

        if (
            logo.startsWith('http://') ||
            logo.startsWith('https://')
        )
            return logo;

        return '/tv-placeholder.png';

    };

    const filtered = useMemo(() => {

        const result = channels.filter(channel => {

            const group =
                (channel.groupName ?? "").trim().toLowerCase();

            const selectedGroup =
                groupFilter.trim().toLowerCase();

            const name =
                (channel.name ?? "").trim().toLowerCase();

            const text =
                search.trim().toLowerCase();

            const matchesGroup =
                selectedGroup === "all" ||
                group === selectedGroup;

            const matchesSearch =
                text === "" ||
                name.includes(text);

            return matchesGroup && matchesSearch;

        });

        console.log({
            groupFilter,
            search,
            total: channels.length,
            filtered: result.length,
            first: result[0]
        });

        return result;

    }, [channels, groupFilter, search]);

    /* Load IPTV providers */

    useEffect(() => {

        fetch(`${API_URL}/iptv/providers`)
            .then(r => r.json())
            .then(data => {

                setProviders(data);

                if (data.length > 0) {

                    setProvider(data[0].id);

                }

            });

    }, []);

    /* Load channels */

    useEffect(() => {

         if (!provider) return;
        setLoading(true);

        fetch(`${API_URL}/iptv/${provider}`)
            .then(r => r.json())
            .then(data => {

                console.log(data[0]);

                setChannels(data);

              

                if (data.length > 0) {

                    setSelected(data[0]);

                }

            }) 
            .finally(() => setLoading(false));;

        

    }, [provider]);

    /* Search */

    

    // Direct media files (no HLS manifest) need Shaka Player instead of hls.js
    const isDirectFile = (url?: string) => {
        if (!url) return false;
        return /\.(mkv|mp4|avi)(\?.*)?$/i.test(url.trim());
    };

    /* Player */
    useEffect(() => {

        if (!selected) return;

        const video = videoRef.current;
        if (!video) return;

        video.pause();

        const url: string = selected.streamUrl;

        let hls: Hls | null = null;
        let shakaPlayer: any = null;
        let cancelled = false;

        if (isDirectFile(url)) {

            // .mkv / .mp4 / .avi -> Shaka Player
            (async () => {

                // @ts-ignore - shaka-player ships without bundled TS types
                const shaka = (await import('shaka-player/dist/shaka-player.ui.js')).default;

                if (cancelled) return;

                shaka.polyfill.installAll();

                if (!shaka.Player.isBrowserSupported()) {
                    console.error('Shaka Player is not supported in this browser');
                    return;
                }

                shakaPlayer = new shaka.Player(video);

                shakaPlayer.addEventListener('error', (event: any) => {
                    console.error('Shaka Player error', event.detail);
                });

                try {
                    await shakaPlayer.load(url);
                    if (!cancelled) {
                        video.play().catch(() => {});
                    }
                } catch (err) {
                    console.error('Shaka Player failed to load', url, err);
                }

            })();

        } else if (Hls.isSupported()) {

            // .m3u8 -> hls.js
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => {});
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {

            video.src = url;
            video.play().catch(() => {});

        }

        return () => {
            cancelled = true;
            if (hls) hls.destroy();
            if (shakaPlayer) shakaPlayer.destroy();
        };

    }, [selected]);

    return (

        <main className="bg-black text-white min-h-screen">

            <Navbar />

            <div className="pt-24 px-8">

                <div className="flex justify-between items-center mb-8">

                    <h1 className="text-5xl font-bold">
                        Live TV
                    </h1>

                    <div className="flex gap-3">

                        <select
                            value={provider}
                            onChange={(e) => setProvider(Number(e.target.value))}
                            className="bg-zinc-900 rounded-xl px-4 py-3"
                        >
                            {providers.map((p) => (
                                <option
                                    key={p.id}
                                    value={p.id}
                                >
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={groupFilter}
                            onChange={(e)=>setGroupFilter(e.target.value)}
                            className="bg-zinc-900 rounded-xl px-4 py-3"
                        >
                            {groups.map(group=>(
                                <option
                                    key={group}
                                    value={group}
                                >
                                    {group}
                                </option>
                            ))}
                        </select>

                    </div>

                </div>
                

                <div className="flex gap-8">

                    {/* LEFT */}

                    <div className="w-[420px]">

                        <input

                            value={search}

                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }

                            placeholder="Search channel..."

                            className="
                                w-full
                                bg-zinc-900
                                rounded-xl
                                p-3
                                mb-5
                            "

                        />

                        {/* <select
                            value={groupFilter}
                            onChange={(e)=>setGroupFilter(e.target.value)}
                            className="bg-zinc-900 rounded-xl px-4 w-56"
                        >
                            {groups.map(group=>(
                                <option key={group}>{group}</option>
                            ))}
                        </select> */}

                        <p className="text-red-500 mb-2">
                            Showing {filtered.length} channels
                        </p>

                        <div className="h-[78vh] overflow-y-auto">  
                             {loading ? (

                                <div className="flex justify-center items-center h-full">

                                    <div
                                        className="
                                            w-10
                                            h-10
                                            border-4
                                            border-zinc-600
                                            border-t-blue-500
                                            rounded-full
                                            animate-spin
                                        "
                                    />

                                </div>

                                ) : (
                                    <div className="space-y-2">
                                        {filtered.map(channel => (

                                            <button

                                                key={`${channel.id}-${channel.name}`}

                                                onClick={() =>
                                                    setSelected(channel)
                                                }

                                                className={`
                                                    w-full
                                                    flex
                                                    items-center
                                                    gap-3
                                                    p-2
                                                    rounded-xl
                                                    transition
                                                    ${
                                                        selected?.streamUrl === channel.streamUrl
                                                        ? 'bg-blue-600'
                                                        : 'bg-zinc-900 hover:bg-zinc-800'
                                                    }
                                                `}

                                            >

                                                <img

                                                    src={
                                                        getLogo(channel.logo)
                                                    }

                                                    className="
                                                        w-10
                                                        h-10
                                                        object-contain
                                                        rounded
                                                        bg-white
                                                        p-1
                                                    "

                                                    onError={(e) => {
                                                        const img = e.currentTarget;

                                                        // prevent infinite loop
                                                        img.onerror = null;

                                                        img.src = "/tv-placeholder.png";
                                                    }}

                                                />

                                                <div className="text-left flex-1">

                                                    <div className="font-semibold">

                                                        {channel.name}

                                                    </div>

                                                    <div className="text-xs text-zinc-400">

                                                        {channel.groupName}

                                                    </div>

                                                </div>

                                            </button>

                                        ))}
                                    </div>
                                    )}
                        </div>

                    </div>

                    {/* PLAYER */}

                    <div className="flex-1">

                        {selected && (

                            <>

                                <h2 className="text-3xl font-bold">

                                    {selected.name}

                                </h2>

                                <p className="text-zinc-400 mb-5">

                                    {selected.groupName}

                                </p>

                                <video

                                    ref={videoRef}

                                    controls

                                    autoPlay

                                    className="
                                        w-full
                                        rounded-2xl
                                        bg-black
                                    "

                                />

                            </>

                        )}

                    </div>

                </div>

            </div>

        </main>

    );

}