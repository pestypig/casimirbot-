import { useEffect } from "react";
import { useQiStore } from "@/store/useQiStore";

type QiStreamParams = Record<string, string | number | boolean | undefined | null>;

let activeQiStreams = 0;

export function useQiStream(enabled = true, params?: QiStreamParams): void {
  const ingest = useQiStore((state) => state.ingest);
  const setConnected = useQiStore((state) => state.setConnected);
  const paramKey = params ? JSON.stringify(params) : "";

  useEffect(() => {
    if (!enabled) {
      if (activeQiStreams === 0) {
        setConnected(false);
      }
      return;
    }
    const qs = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === false) continue;
        qs.set(key, value === true ? "1" : String(value));
      }
    }
    const search = qs.toString();
    const es = new EventSource(`/api/qisnap/stream${search ? `?${search}` : ""}`);
    let opened = false;

    const handleOpen = () => {
      if (!opened) {
        opened = true;
        activeQiStreams += 1;
        setConnected(true);
      }
    };
    const handleClose = () => {
      if (opened) {
        opened = false;
        activeQiStreams = Math.max(0, activeQiStreams - 1);
        if (activeQiStreams === 0) {
          setConnected(false);
        }
      }
    };

    es.onopen = handleOpen;
    es.onerror = () => {
      handleClose();
    };
    es.onmessage = (event) => {
      try {
        ingest(JSON.parse(event.data));
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      handleClose();
      es.close();
    };
  }, [enabled, paramKey, ingest, setConnected]);
}
