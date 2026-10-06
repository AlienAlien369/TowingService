"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";

export type MapMarker = { id: string; lat: number; lng: number; kind: "pickup" | "drop" | "driver" | "me" | "job"; label?: string };

const COLORS: Record<MapMarker["kind"], { bg: string; fg: string; glyph: string }> = {
  pickup: { bg: "#14161A", fg: "#FFC400", glyph: "●" },
  drop: { bg: "#FFC400", fg: "#14161A", glyph: "■" },
  driver: { bg: "#17935A", fg: "#fff", glyph: "🚚" },
  me: { bg: "#2764D8", fg: "#fff", glyph: "◉" },
  job: { bg: "#D93A3F", fg: "#fff", glyph: "!" },
};

const icon = (k: MapMarker["kind"]) =>
  L.divIcon({
    className: "rs-pin",
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    html: `<div style="position:relative;width:36px;height:44px"><div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${COLORS[k].bg};border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.35)"></div><span style="position:absolute;left:0;top:5px;width:36px;text-align:center;font-size:15px;line-height:22px;font-weight:800;color:${COLORS[k].fg}">${COLORS[k].glyph}</span></div>`,
  });

function Fit({ markers, route, fitKey }: { markers: MapMarker[]; route?: [number, number][] | null; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = route && route.length > 1 ? route : markers.map((m) => [m.lat, m.lng] as [number, number]);
    if (pts.length === 0) return;
    if (pts.length === 1) map.setView(pts[0], Math.max(map.getZoom(), 14), { animate: true });
    else map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 16, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
}

function Clicks({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick?.(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function MapView({ center, zoom, tileUrl, markers, route, onMapClick, fitKey, className }: {
  center: [number, number];
  zoom: number;
  tileUrl: string;
  markers: MapMarker[];
  route?: [number, number][] | null;
  onMapClick?: (lat: number, lng: number) => void;
  fitKey: string;
  className?: string;
}) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className={className ?? "h-72 w-full rounded-2xl"} attributionControl>
      <TileLayer url={tileUrl} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' maxZoom={19} />
      {route && route.length > 1 && (
        <>
          <Polyline positions={route} pathOptions={{ color: "#14161A", weight: 8, opacity: 0.9 }} />
          <Polyline positions={route} pathOptions={{ color: "#FFC400", weight: 4 }} />
        </>
      )}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={icon(m.kind)} title={m.label} />
      ))}
      <Fit markers={markers} route={route} fitKey={fitKey} />
      <Clicks onClick={onMapClick} />
    </MapContainer>
  );
}
