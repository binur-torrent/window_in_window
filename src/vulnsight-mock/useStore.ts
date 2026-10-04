import { useEffect, useSyncExternalStore } from "react";
import { getStoreVersion, subscribe, tickLiveScans } from "./store";

/** Re-renders when the mock store changes, and while a live scan is ticking. */
export function useStore() {
  useSyncExternalStore(subscribe, getStoreVersion, getStoreVersion);

  useEffect(() => {
    const timer = window.setInterval(tickLiveScans, 250);
    return () => window.clearInterval(timer);
  }, []);
}
