// ============================================================
// hooks/useGeolocation.ts
// ブラウザの Geolocation API を使った現在地取得フック
// ============================================================

import { useState, useEffect } from "react";
import { LatLng } from "@/types";
import { DEFAULT_CENTER } from "@/data/mockData";

type GeolocationState = {
  /** 現在地座標 (取得成功時) */
  position: LatLng | null;
  /** 位置情報取得中かどうか */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
};

/**
 * 現在地を取得するカスタムフック
 * 取得失敗時は東京駅付近をデフォルトとして返す
 */
export function useGeolocation(): GeolocationState & { center: LatLng } {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        loading: false,
        error: "このブラウザは位置情報をサポートしていません",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          loading: false,
          error: null,
        });
      },
      (err) => {
        console.warn("位置情報の取得に失敗:", err.message);
        setState({
          position: null,
          loading: false,
          error: err.message,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // 取得失敗時は東京駅をデフォルト
  const center = state.position ?? DEFAULT_CENTER;

  return { ...state, center };
}
