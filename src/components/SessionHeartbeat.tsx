'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Routes where there is no session to check, and a 401 is expected/normal.
const PUBLIC_ROUTES = ['/login', '/register'];

export default function SessionHeartbeat() {
    const pathname = usePathname();

    useEffect(() => {
        if (PUBLIC_ROUTES.includes(pathname)) {
            return; // nothing to heartbeat on a public page
        }

        async function heartbeat() {
            try {
                const response = await fetch(`${API_URL}/auth/check`, {
                    credentials: 'include',
                });

                if (response.status === 401) {
                    localStorage.clear();

                    // Guard against redirect-loops if we're already there.
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } catch (err) {
                console.error('Heartbeat failed', err);
            }
        }

        heartbeat();
        const timer = setInterval(heartbeat, 20 * 60 * 1000);
        return () => clearInterval(timer);
    }, [pathname]);

    return null;
}