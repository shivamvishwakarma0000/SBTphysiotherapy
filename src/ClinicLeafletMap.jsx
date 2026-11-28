import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const CLINIC_SHARE_URL = "https://share.google/zvf8bGCaBsoiHA60S";
export const CLINIC_EXACT_LOCATION = {
  name: "Vindhy Physiotherapy & Rehab Center",
  doctor: "Dr. Satyam Vishwakarma (DPT, BPT)",
  address: "Vindhy Physiotherapy & Rehab Center, Atal Chauraha (Amravati), Vindhyachal, Mirzapur, Uttar Pradesh 231001",
  lat: 25.1612,
  lng: 82.5085,
  shareUrl: CLINIC_SHARE_URL,
  phone: "+919793093316"
};

export default function ClinicLeafletMap({
  lat = CLINIC_EXACT_LOCATION.lat,
  lng = CLINIC_EXACT_LOCATION.lng,
  address = CLINIC_EXACT_LOCATION.address,
  height = "180px",
  zoom = 15,
  autoOpenPopup = false,
  className = ""
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Guard against re-initialization if container already has a map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const targetLat = parseFloat(lat) || CLINIC_EXACT_LOCATION.lat;
    const targetLng = parseFloat(lng) || CLINIC_EXACT_LOCATION.lng;

    const map = L.map(mapContainerRef.current, {
      center: [targetLat, targetLng],
      zoom: zoom,
      scrollWheelZoom: false, // Prevents disrupting page scroll on mobile
      zoomControl: true,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    // Use OpenStreetMap standard tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
    }).addTo(map);

    // Custom high-contrast clinical pin icon with medical cross SVG
    const clinicIcon = L.divIcon({
      className: "leaflet-custom-clinic-pin",
      html: `
        <div style="position:relative; width:34px; height:42px; cursor:pointer;">
          <svg viewBox="0 0 32 40" width="34" height="42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 24 16 24s16-13.5 16-24c0-8.837-7.163-16-16-16z" fill="#0f766e"/>
            <path d="M16 2C8.268 2 2 8.268 2 16c0 9.2 14 21.2 14 21.2S30 25.2 30 16C30 8.268 23.732 2 16 2z" fill="#14b8a6"/>
            <circle cx="16" cy="15" r="10.5" fill="#ffffff"/>
            <!-- Medical Cross -->
            <path d="M14 8.5h4v4h4v4h-4v4h-4v-4h-4v-4h4v-4z" fill="#0f766e"/>
          </svg>
        </div>
      `,
      iconSize: [34, 42],
      iconAnchor: [17, 42],
      popupAnchor: [0, -42]
    });

    const marker = L.marker([targetLat, targetLng], {
      icon: clinicIcon,
      title: "Vindhy Physiotherapy & Rehab Center - Dr. Satyam Vishwakarma"
    }).addTo(map);

    const popupHtml = `
      <div style="font-family: inherit; font-size: 12px; color: #0f172a; line-height: 1.4; min-width: 200px; padding: 2px;">
        <div style="font-weight: 800; font-size: 13px; color: #0f766e; margin-bottom: 2px;">
          🏥 Vindhy Physiotherapy & Rehab Center
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #0284c7; margin-bottom: 5px;">
          Dr. Satyam Vishwakarma (DPT, BPT)
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
          📍 ${address || CLINIC_EXACT_LOCATION.address}
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <a href="${CLINIC_SHARE_URL}" target="_blank" rel="noreferrer" style="flex: 1; background: #0f766e; color: #ffffff; text-decoration: none; padding: 5px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">
            ↗ Google Maps
          </a>
          <a href="tel:${CLINIC_EXACT_LOCATION.phone}" style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; text-decoration: none; padding: 5px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; text-align: center;">
            📞 Call
          </a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, {
      maxWidth: 260,
      minWidth: 200,
      closeButton: true
    });

    if (autoOpenPopup) {
      marker.openPopup();
    }

    // Invalidate map size after mount so tiles load completely
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng, address, zoom, autoOpenPopup]);

  const handleCenter = (e) => {
    e.preventDefault();
    if (mapInstanceRef.current) {
      const targetLat = parseFloat(lat) || CLINIC_EXACT_LOCATION.lat;
      const targetLng = parseFloat(lng) || CLINIC_EXACT_LOCATION.lng;
      mapInstanceRef.current.setView([targetLat, targetLng], zoom, { animate: true });
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: height,
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
      }}
      className={`clinic-leaflet-container ${className}`}
    >
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#e2e8f0"
        }}
      />
      {/* Quick Recenter Overlay Button */}
      <button
        onClick={handleCenter}
        title="Center map to Vindhy Physiotherapy & Rehab Center"
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.95)",
          color: "#0f766e",
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          padding: "4px 8px",
          fontSize: "11px",
          fontWeight: "700",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
        }}
      >
        <span>🎯</span>
        <span>Center Clinic</span>
      </button>
    </div>
  );
}
