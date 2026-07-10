'use client';

import { useEffect } from 'react';

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

            const token =
                localStorage.getItem("token");

            const headers =
                new Headers(init?.headers);

            if (token) {
                headers.set(
                    "Authorization",
                    `Bearer ${token}`
                );
            }

            let response =
                await originalFetch(input, {
                    ...init,
                    headers
                });

            if (
                response.status !== 401
            ) {
                return response;
            }

            // Don't refresh the refresh request itself
            if (
                typeof input === "string" &&
                input.includes("/auth/refresh")
            ) {
                return response;
            }

            const refreshResponse =
                await originalFetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`
                );

            if (!refreshResponse.ok) {

                localStorage.removeItem("token");

                window.location.href =
                    "/login";

                return response;

            }

            const refreshData =
                await refreshResponse.json();

            localStorage.setItem(
                "token",
                refreshData.token
            );

            headers.set(
                "Authorization",
                `Bearer ${refreshData.token}`
            );

            return originalFetch(
                input,
                {
                    ...init,
                    headers
                }
            );

        };

        return () => {

            window.fetch =
                originalFetch;

        };

    }, []);

    return children;

}