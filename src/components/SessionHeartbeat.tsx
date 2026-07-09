'use client';

import { useEffect } from 'react';

const API_URL =
    process.env.NEXT_PUBLIC_API_URL;

export default function SessionHeartbeat() {

    useEffect(() => {

        async function heartbeat() {

            try {

                const response = await fetch(
                    `${API_URL}/auth/check`,
                    {
                        credentials: "include"
                    }
                );

                if (response.status === 401) {

                    localStorage.clear();

                    window.location.href = "/login";

                }

            } catch (err) {

                console.error(
                    "Heartbeat failed",
                    err
                );

            }

        }

        heartbeat();

        const timer = setInterval(
            heartbeat,
            20 * 60 * 1000 // 20 minutes
        );

        return () => clearInterval(timer);

    }, []);

    return null;

}