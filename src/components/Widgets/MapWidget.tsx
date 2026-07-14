import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card } from '../Layout/Card';
import { MapPin, Navigation } from 'lucide-react';
import { getGPSLocation } from '@/lib/engines/gps-service';
import type { Coordinates } from '@/lib/engines/gps-service';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationUpdater = ({ coords }: { coords: Coordinates }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([coords.lat, coords.lon], 13);
  }, [coords, map]);
  return null;
};

export const MapWidget: React.FC<{ className?: string }> = ({ className }) => {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getGPSLocation();
        setCoords(location);
      } catch (err: any) {
        setError(err.message || 'GPS failed');
        setCoords({ lat: 51.505, lon: -0.09 });
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, []);

  return (
    <Card className={`flex flex-col min-h-[320px] p-0 overflow-hidden ${className}`}>
      <div className="flex justify-between items-center p-6 pb-2 z-10 absolute top-0 left-0 right-0 pointer-events-none">
        <div className="flex items-center gap-3 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm pointer-events-auto">
          <MapPin className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight text-xs">
            Live Location
          </h3>
        </div>
        {loading && (
          <div className="bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm pointer-events-auto">
            <Navigation className="w-4 h-4 text-zinc-500 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 w-full relative z-0 [&_.leaflet-container]:dark:invert [&_.leaflet-container]:dark:hue-rotate-180 [&_.leaflet-container]:transition-all">
        {coords && (
          <MapContainer 
            center={[coords.lat, coords.lon]} 
            zoom={13} 
            scrollWheelZoom={false}
            className="w-full h-full min-h-[320px]"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={[coords.lat, coords.lon]}>
              <Popup className="[&_.leaflet-popup-content-wrapper]:bg-white [&_.leaflet-popup-content-wrapper]:dark:bg-black [&_.leaflet-popup-content-wrapper]:border [&_.leaflet-popup-content-wrapper]:border-zinc-200 [&_.leaflet-popup-content-wrapper]:dark:border-zinc-800 [&_.leaflet-popup-content-wrapper]:text-zinc-900 [&_.leaflet-popup-content-wrapper]:dark:text-zinc-50 [&_.leaflet-popup-tip]:dark:bg-black [&_.leaflet-popup-tip]:dark:border-zinc-800">
                <div className="font-mono text-xs font-medium">
                  Smart Hub Node<br/>
                  Active
                </div>
              </Popup>
            </Marker>
            <LocationUpdater coords={coords} />
          </MapContainer>
        )}
      </div>
      
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md text-zinc-500 text-[10px] uppercase font-medium tracking-wide py-2 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm z-10">
          Location fallback: {error}
        </div>
      )}
    </Card>
  );
};
