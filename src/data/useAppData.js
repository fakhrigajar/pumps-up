import { useCallback, useRef, useState } from "react";
import { createDefaultData } from "../data.js";

export function useAppData() {
  const [data, setData] = useState(createDefaultData);
  const current = useRef(data);

  // Commit each local action once, including all affected screens.
  const apply = useCallback((action) => {
    const next = action(current.current);
    current.current = next;
    setData(next);
    return next;
  }, []);

  return [data, apply];
}
