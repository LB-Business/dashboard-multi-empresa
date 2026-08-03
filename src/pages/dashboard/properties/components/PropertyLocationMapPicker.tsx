import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];

const markerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 9999px 9999px 9999px 0;
      transform: rotate(-45deg);
      background: #facc15;
      border: 3px solid #111827;
      box-shadow: 0 10px 25px rgba(0,0,0,.35);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 12px;
        height: 12px;
        border-radius: 9999px;
        background: #111827;
      "></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

type PropertyLocationMapPickerProps = {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
};

function parseCoordinate(value: string) {
  if (value === undefined || value === null) return undefined;

  const parsed = Number(String(value).replace(",", "."));

  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatCoordinate(value: number) {
  return value.toFixed(7).replace(/0+$/, "").replace(/\.$/, "");
}

function MapClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapAutoCenter({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      map.setView(center, map.getZoom() || 15, {
        animate: true,
      });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [center, map]);

  return null;
}

export function PropertyLocationMapPicker({
  street,
  number,
  neighborhood,
  city,
  state,
  country,
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
}: PropertyLocationMapPickerProps) {
  const [isSearching, setIsSearching] = useState(false);

  const parsedLatitude = parseCoordinate(latitude);
  const parsedLongitude = parseCoordinate(longitude);

  const hasCoordinates =
    parsedLatitude !== undefined && parsedLongitude !== undefined;

  const center: [number, number] = hasCoordinates
    ? [parsedLatitude, parsedLongitude]
    : DEFAULT_CENTER;

  const addressQuery = useMemo(() => {
    return [street, number, neighborhood, city, state, country || "Argentina"]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");
  }, [city, country, neighborhood, number, state, street]);

  function setCoordinates(lat: number, lng: number) {
    onLatitudeChange(formatCoordinate(lat));
    onLongitudeChange(formatCoordinate(lng));
  }

  async function searchAddress() {
    if (!addressQuery.trim()) {
      toast.error("Cargá una dirección antes de buscar en el mapa.");
      return;
    }

    try {
      setIsSearching(true);

      const params = new URLSearchParams({
        format: "jsonv2",
        limit: "1",
        addressdetails: "1",
        countrycodes: "ar",
        q: addressQuery,
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error("No se pudo buscar la dirección.");
      }

      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : null;

      if (!first?.lat || !first?.lon) {
        toast.warning(
          "No encontramos esa dirección. Probá con calle, número, ciudad y provincia, o marcá el punto manualmente en el mapa.",
        );
        return;
      }

      setCoordinates(Number(first.lat), Number(first.lon));
      toast.success("Ubicación encontrada. Revisá el pin y ajustalo si hace falta.");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo buscar la dirección.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Seleccionar ubicación en mapa
          </p>
          <p className="text-xs text-muted-foreground">
            Buscá por dirección, hacé click en el mapa o arrastrá el pin.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={searchAddress}
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="mr-1.5 h-4 w-4" />
              Buscar dirección
            </>
          )}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={center}
          zoom={hasCoordinates ? 16 : 11}
          scrollWheelZoom
          className="h-[320px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapAutoCenter center={center} />
          <MapClickHandler onSelect={setCoordinates} />

          {hasCoordinates ? (
            <Marker
              position={[parsedLatitude, parsedLongitude]}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const marker = event.target as L.Marker;
                  const position = marker.getLatLng();
                  setCoordinates(position.lat, position.lng);
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-2">
        <div className="rounded-md border border-border bg-background/70 px-3 py-2">
          <span className="font-medium text-foreground">Latitud:</span>{" "}
          {latitude || "Sin seleccionar"}
        </div>
        <div className="rounded-md border border-border bg-background/70 px-3 py-2">
          <span className="font-medium text-foreground">Longitud:</span>{" "}
          {longitude || "Sin seleccionar"}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Mercado Libre exige latitud y longitud. El buscador es aproximado:
          revisá el pin y movelo hasta la ubicación correcta antes de publicar.
        </p>
      </div>
    </div>
  );
}
