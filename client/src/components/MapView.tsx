import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap } from "react-leaflet";
import { Icon, LatLngBounds } from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { Coupon } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  deals: (Coupon & { distance?: number })[];
  onViewDeal?: (deal: Coupon) => void;
  boundingBox?: [number, number, number, number];
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

export default function MapView({ center, zoom = 12, deals, onViewDeal, boundingBox }: MapViewProps) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border">
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
      </MapContainer>
    </div>
  );
}
