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

  // 同じ場所・近い場所の複数ピンをグルーピングして、全員分を円状にずらして表示する
  // DB上の lat/lng は変更せず、表示座標だけを調整する。
  const computeOffsetPositions = (recs: ToiletRecord[]) => {
    type Cluster = {
      centerLat: number;
      centerLng: number;
      items: ToiletRecord[];
    };

    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const distanceMeters = (
      a: { lat: number; lng: number },
      b: { lat: number; lng: number }
    ) => {
      const earthRadius = 6371000;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const sinLat = Math.sin(dLat / 2);
      const sinLng = Math.sin(dLng / 2);
      const h =
        sinLat * sinLat +
        Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
      return 2 * earthRadius * Math.asin(Math.sqrt(h));
    };

    // GPSの微妙なブレでも「同じ場所」として扱う距離。
    // 同じトイレ・同じ施設内の投稿をまとめて円状展開する。
    const clusterThresholdMeters = 15;

    const sorted = [...recs].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return a.id.localeCompare(b.id);
    });

    const clusters: Cluster[] = [];

    sorted.forEach((record) => {
      const existing = clusters.find(
        (cluster) =>
          distanceMeters(
            { lat: record.lat, lng: record.lng },
            { lat: cluster.centerLat, lng: cluster.centerLng }
          ) <= clusterThresholdMeters
      );

      if (existing) {
        existing.items.push(record);
        // クラスタ中心を平均値に更新して、全員分のピンが自然に広がるようにする
        const count = existing.items.length;
        existing.centerLat =
          (existing.centerLat * (count - 1) + record.lat) / count;
        existing.centerLng =
          (existing.centerLng * (count - 1) + record.lng) / count;
      } else {
        clusters.push({
          centerLat: record.lat,
          centerLng: record.lng,
          items: [record],
        });
      }
    });

    const result: Record<string, { lat: number; lng: number }> = {};

    clusters.forEach((cluster) => {
      const items = cluster.items;
      if (items.length === 1) {
        result[items[0].id] = { lat: items[0].lat, lng: items[0].lng };
        return;
      }

      const n = items.length;
      // 件数が増えてもアイコンが重なりにくいように少しずつ半径を広げる
      const radiusMeters = Math.min(28, 10 + n * 1.5);

      items.forEach((item, idx) => {
        const angle = (2 * Math.PI * idx) / n - Math.PI / 2;
        const latOffset = (radiusMeters * Math.cos(angle)) / 111320;
        const lngMetersPerDegree =
          111320 * Math.cos((cluster.centerLat * Math.PI) / 180);
        const lngOffset =
          (radiusMeters * Math.sin(angle)) / (lngMetersPerDegree || 111320);

        result[item.id] = {
          lat: cluster.centerLat + latOffset,
          lng: cluster.centerLng + lngOffset,
        };
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
