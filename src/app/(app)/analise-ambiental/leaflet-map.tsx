
'use client';

import * as React from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';


// Workaround for a known issue with leaflet icons in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});


interface LeafletMapProps {
  polygon: any;
  onPolygonCreated: (geoJSON: any) => void;
}

// Componente para centralizar o mapa quando o polígono for carregado
const MapUpdater = ({ polygon }: { polygon: any }) => {
    const map = useMap();
    React.useEffect(() => {
        if (polygon) {
            try {
                const bounds = L.geoJSON(polygon).getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds);
                }
            } catch (error) {
                console.error("Error creating bounds for polygon:", error);
            }
        }
    }, [polygon, map]);
    return null;
}


const LeafletMap = ({ polygon, onPolygonCreated }: LeafletMapProps) => {
  
  const handleCreated = (e: any) => {
    const layer = e.layer;
    onPolygonCreated(layer.toGeoJSON());
  };

  const handleEdited = (e: any) => {
    const layers = e.layers;
    layers.eachLayer((layer: any) => {
      onPolygonCreated(layer.toGeoJSON());
    });
  };

  const handleDeleted = () => {
    onPolygonCreated(null);
  };
  
  return (
    <MapContainer
      center={[-18.5122, -44.5550]}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/en-us/home">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <FeatureGroup>
        <EditControl
          position="topleft"
          onCreated={handleCreated}
          onEdited={handleEdited}
          onDeleted={handleDeleted}
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
          }}
        />
        {polygon && <MapUpdater polygon={polygon} />}
      </FeatureGroup>
    </MapContainer>
  );
};

export default LeafletMap;
