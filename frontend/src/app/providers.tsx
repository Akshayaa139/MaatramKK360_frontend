"use client";

import { SessionProvider } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "ta";
const LanguageContext = createContext<{ language: Language; setLanguage: (l: Language) => void }>({ language: "en", setLanguage: () => {} });
export const useLanguage = () => useContext(LanguageContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kk_lang");
      if (saved === "en" || saved === "ta") setLanguage(saved as Language);
    } catch {}
  }, []);
  const update = (l: Language) => {
    setLanguage(l);
    try { localStorage.setItem("kk_lang", l); } catch {}
  };
  return (
    <SessionProvider>
      <LanguageContext.Provider value={{ language, setLanguage: update }}>
        {children}
      </LanguageContext.Provider>
    </SessionProvider>
  );
}
