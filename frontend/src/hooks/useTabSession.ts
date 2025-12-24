"use client";

import { useState, useEffect } from "react";

export function useTabSession() {
    const [session, setSession] = useState<{ user: any } | null>(null);
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                const stored = sessionStorage.getItem("kk_user");
                if (stored) {
                    const user = JSON.parse(stored);
                    setSession({ user });
                    setStatus("authenticated");
                } else {
                    setSession(null);
                    setStatus("unauthenticated");
                }
            }
        } catch (e) {
            setSession(null);
            setStatus("unauthenticated");
        }
    }, []);

    return { data: session, status };
}
