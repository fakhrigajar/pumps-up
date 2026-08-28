import { useEffect, useRef } from "react";

const MAX_GAP = 60;

const MIN_LENGTH = 4;

export function createScanReader({ maxGap = MAX_GAP, minLength = MIN_LENGTH } = {}) {
  let buffer = "";
  let lastAt = 0;

  return function read(key, at) {
    const burst = buffer.length > 0 && at - lastAt <= maxGap;

    if (key === "Enter") {
      const code = burst && buffer.length >= minLength ? buffer : null;
      buffer = "";
      return { code, suppress: code !== null };
    }

    if (key.length !== 1) return { code: null, suppress: false };

    buffer = burst ? buffer + key : key;
    lastAt = at;
    return { code: null, suppress: burst };
  };
}

export function useBarcodeScanner(onScan, { enabled = true } = {}) {
  const handler = useRef(onScan);
  useEffect(() => {
    handler.current = onScan;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const read = createScanReader();

    const onKeyDown = (event) => {
      if (event.repeat || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const { code, suppress } = read(event.key, event.timeStamp);
      if (suppress) event.preventDefault();

      if (code) {
        event.stopPropagation();
        handler.current(code);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled]);
}
