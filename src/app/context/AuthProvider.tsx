'use client';

import { useEffect } from 'react';

// Endpoints where a 401 is an expected, legitimate response —
// not a sign that the session expired.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/register'];

function getUrlString(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return input.url; // Request object
}

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {

    useEffect(() => {

        const originalFetch = window.fetch;

        window.fetch = async (
            input: RequestInfo | URL,
            init?: RequestInit
        ) => {

            const url = getUrlString(input);
            const isAuthEndpoint = AUTH_ENDPOINTS.some((e) => url.includes(e));

            const token = localStorage.getItem('token');
            const headers = new Headers(init?.headers);

            if (token && !isAuthEndpoint) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            const response = await originalFetch(input, {
                ...init,
                headers,
            });

            if (response.status !== 401) {
                return response;
            }

            // A 401 from login/refresh/register is a normal app response
            // (e.g. wrong password) — never treat it as "session expired".
            if (isAuthEndpoint) {
                return response;
            }

            const refreshResponse = await originalFetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`
            );

            if (!refreshResponse.ok) {
                localStorage.removeItem('token');

                // Avoid redirecting (and therefore reloading) if we're
                // already on the login page — this was the source of
                // the infinite reload loop.
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }

                return response;
            }

            const refreshData = await refreshResponse.json();
            localStorage.setItem('token', refreshData.token);
            headers.set('Authorization', `Bearer ${refreshData.token}`);

            return originalFetch(input, {
                ...init,
                headers,
            });
        };

        return () => {
            window.fetch = originalFetch;
        };

    }, []);

    return children;
}