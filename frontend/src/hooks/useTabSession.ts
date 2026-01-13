"use client";

import { useState, useEffect } from "react";
import socketService from "@/services/socketService";

export type User = {
  name: string;
  email: string;
  role: string;
  id: string;
  [key: string]: unknown;
};

export function useTabSession() {
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    const loadSession = () => {
      try {
        if (typeof window !== "undefined") {
          const stored = sessionStorage.getItem("kk_user");
          const token = sessionStorage.getItem("token");
          if (stored) {
            const user = JSON.parse(stored);
            setSession({ user });
            setStatus("authenticated");
            if (token) {
              socketService.connect(token);
            }
          } else {
            setSession(null);
            setStatus("unauthenticated");
          }
        }
      } catch {
        setSession(null);
        setStatus("unauthenticated");
      }
    };

    loadSession();

    const handleSessionExpired = () => {
      setSession(null);
      setStatus("unauthenticated");
    };

    window.addEventListener("session-expired", handleSessionExpired);

    // Listen for storage events (though sessionStorage doesn't trigger across same tab, manual dispatch might help)
    window.addEventListener("storage", loadSession);

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
      window.removeEventListener("storage", loadSession);
    };
  }, []);
  return { data: session, status };
}
