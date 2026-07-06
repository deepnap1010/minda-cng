import { useEffect, useState } from "react";
import { USE_MOCK } from "./api";

// Gently animates gauge values for a live feel. In mock mode it jitters around the
// midpoint locally; with a real API it simply mirrors the latest fetched values
// (your 5s polling / socket feed drives the motion instead).
export function useFloat(gaugeTags, initial, active = true) {
  const init = () => {
    const o = {};
    (gaugeTags || []).forEach((g) => {
      o[g.tag] = typeof initial?.[g.tag] === "number" ? initial[g.tag] : (g.min + g.max) / 2;
    });
    return o;
  };
  const [vals, setVals] = useState(init);

  const initKey = JSON.stringify(initial ?? {});
  useEffect(() => {
    if (!USE_MOCK) setVals(init());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey]);

  useEffect(() => {
    if (!USE_MOCK || !active || !gaugeTags?.length) return;
    const t = setInterval(() => {
      setVals((prev) => {
        const next = { ...prev };
        gaugeTags.forEach((g) => {
          let v = (next[g.tag] ?? (g.min + g.max) / 2) + (Math.random() - 0.5) * (g.max - g.min) * 0.03;
          next[g.tag] = Math.max(g.min, Math.min(g.max, v));
        });
        return next;
      });
    }, 900);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey, active]);

  return vals;
}
