"use client";

import { useEffect, useMemo, useState } from "react";
import type { Prediction } from "./types";

const STORAGE_KEY = "emotion_demo_predictions_v1";

function safeParse(json: string | null): Prediction[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v as Prediction[];
  } catch {
    return [];
  }
}

export function usePredictionStore() {
  const [items, setItems] = useState<Prediction[]>([]);

  useEffect(() => {
    setItems(safeParse(localStorage.getItem(STORAGE_KEY)));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  return useMemo(() => {
    return {
      items,
      add: (p: Prediction) => setItems((prev) => [p, ...prev]),
      addMany: (ps: Prediction[]) => setItems((prev) => [...ps.reverse(), ...prev]),
      clear: () => setItems([]),
    };
  }, [items]);
}
