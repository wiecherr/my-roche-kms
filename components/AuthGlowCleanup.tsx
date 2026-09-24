"use client";

import { useEffect } from "react";

export default function AuthGlowCleanup() {
  useEffect(() => {
    // Löscht das auth_flash_event Cookie nach 4 Sekunden (4000ms)
    const timer = setTimeout(() => {
      document.cookie = "auth_flash_event=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    }, 400000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}