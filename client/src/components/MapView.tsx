import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap } from "react-leaflet";
import { Icon, LatLngBounds } from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { Coupon } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Star } from "lucide-react";

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  deals: (Coupon & { distance?: number })[];
  onViewDeal?: (deal: Coupon) => void;
  boundingBox?: [number, number, number, number];
  recommendedSpot?: (Coupon & { distance?: number }) | null;
}

function MapBoundsUpdater({ boundingBox }: { boundingBox?: [number, number, number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (boundingBox) {
      const [south, north, west, east] = boundingBox;
      const bounds = new LatLngBounds([south, west], [north, east]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [boundingBox, map]);
  
  return null;
}

const storeIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const recommendedIcon = new Icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDMwIDQxIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdvbGRHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZmQ3MDA7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZhNTAwO3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxwYXRoIGQ9Ik0xNSwyIEMyMiwyIDI4LDggMjgsMTUgQzI4LDI0IDE1LDM5IDE1LDM5IEMxNSwzOSAyLDI0IDIsMTUgQzIsOCA4LDIgMTUsMnoiIGZpbGw9InVybCgjZ29sZEdyYWRpZW50KSIgc3Ryb2tlPSIjZmY4ODAwIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIxNSIgeT0iMjAiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiPuKtkzwvdGV4dD48L3N2Zz4=",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 41],
  iconAnchor: [15, 41],
  popupAnchor: [0, -34],
  shadowSize: [41, 41],
});

export default function MapView({ center, zoom = 12, deals, onViewDeal, boundingBox, recommendedSpot }: MapViewProps) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border map-container-wrapper">
      <style>{`
        .map-container-wrapper .leaflet-bottom {
          bottom: 10px !important;
        }
        .map-container-wrapper .leaflet-control-attribution {
          font-size: 10px;
          padding: 2px 5px;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater boundingBox={boundingBox} />
        
        {boundingBox && (
          <Rectangle
            bounds={[
              [boundingBox[0], boundingBox[2]], // southwest
              [boundingBox[1], boundingBox[3]], // northeast
            ]}
            pathOptions={{
              fillColor: "hsl(var(--primary))",
              fillOpacity: 0.1,
              color: "hsl(var(--primary))",
              weight: 2,
              opacity: 0.6,
            }}
          />
        )}
        
        {deals.map((deal) => {
          if (!deal.latitude || !deal.longitude) return null;
          
          // Check if this is the recommended spot (to avoid duplicate markers)
          const isRecommended = recommendedSpot && deal.id === recommendedSpot.id;
          if (isRecommended) return null; // Skip - will be rendered as recommended marker
          
          return (
            <Marker
              key={deal.id}
              position={[deal.latitude, deal.longitude]}
              icon={storeIcon}
            >
              <Popup>
                <div className="min-w-[200px] p-2">
                  <div className="flex items-center gap-2 mb-2">
                    {deal.storeLogoUrl && (
                      <img
                        src={deal.storeLogoUrl}
                        alt={deal.storeName}
                        className="w-6 h-6 object-contain rounded"
                      />
                    )}
                    <p className="font-semibold text-sm">{deal.storeName}</p>
                  </div>
                  
                  <h3 className="text-lg font-bold text-primary mb-1">
                    {deal.discountAmount}
                  </h3>
                  
                  <p className="text-sm mb-2 line-clamp-2">{deal.title}</p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {deal.category}
                    </Badge>
                    {deal.distance !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{deal.distance.toFixed(1)} mi</span>
                      </div>
                    )}
                  </div>
                  
                  {onViewDeal && (
                    <Button
                      size="sm"
                      onClick={() => onViewDeal(deal)}
                      className="w-full gap-2"
                      data-testid={`button-map-popup-view-${deal.id}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Deal
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Recommended Spot Marker */}
        {recommendedSpot && recommendedSpot.latitude && recommendedSpot.longitude && (
          <Marker
            key={`recommended-${recommendedSpot.id}`}
            position={[recommendedSpot.latitude, recommendedSpot.longitude]}
            icon={recommendedIcon}
          >
            <Popup>
              <div className="min-w-[220px] p-2">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 fill-orange-600 text-orange-600" />
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                    Recommended Spot
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  {recommendedSpot.storeLogoUrl && (
                    <img
                      src={recommendedSpot.storeLogoUrl}
                      alt={recommendedSpot.storeName}
                      className="w-6 h-6 object-contain rounded"
                    />
                  )}
                  <p className="font-semibold text-sm">{recommendedSpot.storeName}</p>
                </div>
                
                <h3 className="text-xl font-bold text-primary mb-1">
                  {recommendedSpot.discountAmount}
                </h3>
                
                <p className="text-sm mb-2 line-clamp-2">{recommendedSpot.title}</p>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {recommendedSpot.category}
                  </Badge>
                  {recommendedSpot.distance !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{recommendedSpot.distance.toFixed(1)} mi</span>
                    </div>
                  )}
                </div>
                
                {onViewDeal && (
                  <Button
                    size="sm"
                    onClick={() => onViewDeal(recommendedSpot)}
                    className="w-full gap-2"
                    data-testid={`button-map-popup-view-recommended`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Deal
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
