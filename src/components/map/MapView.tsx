// ============================================================
// components/map/MapView.tsx
// Leaflet 地図コンポーネント（SSR 無効で動的インポート必須）
// ============================================================

"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { ToiletRecord, LatLng } from "@/types";
import RecordPopup from "./RecordPopup";

// ============================================================
// Leaflet デフォルトアイコンのパス修正
// next.js では webpack によって画像パスがずれるため手動で設定
// ============================================================
function initLeafletIcons() {
  // @ts-expect-error: Leaflet の内部プロパティにアクセス
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

/** 💩 カスタムピンアイコン */
function createToiletIcon() {
  return L.divIcon({
    html: `<div class="toilet-pin">🚽</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

/** 🔵 現在地アイコン */
function createCurrentLocationIcon() {
  return L.divIcon({
    html: `<div class="current-location-dot"></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// ============================================================
// 地図中心を動的に変更するサブコンポーネント
// ============================================================
function MapCenterController({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
}

function MapReadyController({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
    setTimeout(() => map.invalidateSize(), 0);
  }, [map, onReady]);

  return null;
}

// ============================================================
// Props
// ============================================================
type Props = {
  center: LatLng;
  currentPosition: LatLng | null;
  records: ToiletRecord[];
  currentUserId?: string;
  onDeleteRecord: (recordId: string) => void;
};

// ============================================================
// MapView 本体
// ============================================================
export default function MapView({ center, currentPosition, records, currentUserId, onDeleteRecord }: Props) {
  const iconsInitialized = useRef(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!iconsInitialized.current) {
      initLeafletIcons();
      iconsInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [records, currentPosition, center]);

  const toiletIcon = createToiletIcon();
  const currentLocationIcon = createCurrentLocationIcon();

  // 重複または近接する座標をグルーピングして、同一位置に複数ピンがある場合は
  // 小さく円状にずらして表示する
  const computeOffsetPositions = (recs: ToiletRecord[]) => {
    // 座標をキーにグループ化（少数第6位で丸める）
    const groups: Record<string, ToiletRecord[]> = {};
    recs.forEach((r) => {
      const key = `${r.lat.toFixed(6)}:${r.lng.toFixed(6)}`;
      groups[key] = groups[key] || [];
      groups[key].push(r);
    });

    const result: Record<string, { lat: number; lng: number }> = {};

    Object.keys(groups).forEach((key) => {
      const items = groups[key];
      if (items.length === 1) {
        result[items[0].id] = { lat: items[0].lat, lng: items[0].lng };
        return;
      }

      // 並べる半径（メートル）。アイコンサイズに合わせて小さめにする
      const baseRadiusMeters = 8; // 8m 程度
      const n = items.length;

      items.forEach((item, idx) => {
        // 円周上に等間隔に配置
        const angle = (2 * Math.PI * idx) / n;
        const radius = baseRadiusMeters + (idx % 2) * 2; // 少しばらつかせる

        // 緯度1度あたりのメートル数は約111320m
        const latOffset = (radius * Math.cos(angle)) / 111320;
        // 経度のメートル換算は緯度によって変化する
        const lngMetersPerDegree = 111320 * Math.cos((item.lat * Math.PI) / 180);
        const lngOffset = (radius * Math.sin(angle)) / (lngMetersPerDegree || 111320);

        result[item.id] = { lat: item.lat + latOffset, lng: item.lng + lngOffset };
      });
    });

    return result;
  };

  const offsetMap = computeOffsetPositions(records);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      className="map-container"
      zoomControl={true}
    >
      <MapReadyController onReady={(map) => { mapRef.current = map; }} />
      {/* OpenStreetMap タイル */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 地図中心を追従 */}
      <MapCenterController center={center} />

      {/* 現在地マーカーと精度円 */}
      {currentPosition && (
        <>
          <Circle
            center={[currentPosition.lat, currentPosition.lng]}
            radius={50}
            pathOptions={{ color: "#3b82f6", fillColor: "#93c5fd", fillOpacity: 0.3, weight: 1 }}
          />
          <Marker
            position={[currentPosition.lat, currentPosition.lng]}
            icon={currentLocationIcon}
          />
        </>
      )}

      {/* 記録ピン */}
      {records.map((record) => {
        const pos = offsetMap[record.id] ?? { lat: record.lat, lng: record.lng };
        return (
          <Marker key={record.id} position={[pos.lat, pos.lng]} icon={toiletIcon}>
            <Popup maxWidth={240} className="record-popup-wrapper">
              <RecordPopup
                record={record}
                currentUserId={currentUserId}
                onDelete={onDeleteRecord}
              />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
    
  );
}
