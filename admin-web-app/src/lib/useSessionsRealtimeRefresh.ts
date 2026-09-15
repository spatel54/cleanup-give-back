"use client";

/**
 * Keeps Home "N to review", Sessions, and Attention in sync with mobile
 * finalize (`active` → `under_review`).
 *
 * 1. Supabase Realtime postgres_changes on `public.sessions` (INSERT/UPDATE/DELETE)
 * 2. Poll + refresh on tab focus, because Realtime can connect and still
 *    deliver nothing (RLS / replica identity / BYPASS_AUTH with no admin JWT)
 *
 * Server reads use the cookie-free service role (`createDataClient`) with
 * `cache: 'no-store'`, so `router.refresh()` actually re-queries Postgres
 * instead of a cached RSC payload.
 *
 * Realtime still needs `admin_read_all_sessions` + publication
 * (`008_admin_sessions_realtime_read.sql`) and FULL replica identity
 * (`030_sessions_replica_identity_full.sql`) for UPDATE events.
 */
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 15_000;
const DEBOUNCE_MS = 400;

export function useSessionsRealtimeRefresh() {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    function refreshNow() {
      router.refresh();
    }

    function scheduleRefresh() {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(refreshNow, DEBOUNCE_MS);
    }

    const channel = supabase
      .channel("admin-sessions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sessions" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "sessions" },
        scheduleRefresh,
      )
      .subscribe();

    const poll = setInterval(refreshNow, POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") refreshNow();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refreshNow);

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refreshNow);
      supabase.removeChannel(channel);
    };
  }, [router]);
}
