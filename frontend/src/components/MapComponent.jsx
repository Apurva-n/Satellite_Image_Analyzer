import React, { useEffect, useRef } from 'react';
import L from '../utils/leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

const MapComponent = ({
  bbox,
  onBBoxChange,
  thumbnailUrl,
  overlayOpacity = 0.9,
  showOverlay = true,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const imageOverlayRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return;

    // Basemaps
    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 18,
      }
    );

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    const cartoLabels = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; CartoDB',
        maxZoom: 19,
      }
    );

    const map = L.map(mapContainerRef.current, {
      center: [18.5204, 73.8567], // Pune default
      zoom: 11,
      layers: [esriSatellite, cartoLabels],
    });

    const baseMaps = {
      'Satellite (Esri)': esriSatellite,
      'Street Map (OSM)': osm,
    };

    const overlayMaps = {
      'Place Labels': cartoLabels,
    };

    L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);

    // Feature group for drawn rectangle
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Draw control restricted to rectangle
    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polyline: false,
        polygon: false,
        circle: false,
        marker: false,
        circlemarker: false,
        rectangle: {
          shapeOptions: {
            color: '#00f2fe',
            weight: 2,
            fillColor: '#4facfe',
            fillOpacity: 0.2,
          },
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Event: Shape Created
    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      const bounds = layer.getBounds();
      // bbox format: [lon_min, lat_min, lon_max, lat_max]
      const newBbox = [
        Number(bounds.getWest().toFixed(6)),
        Number(bounds.getSouth().toFixed(6)),
        Number(bounds.getEast().toFixed(6)),
        Number(bounds.getNorth().toFixed(6)),
      ];
      onBBoxChange(newBbox);
    });

    // Event: Shape Edited
    map.on(L.Draw.Event.EDITED, (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        const bounds = layer.getBounds();
        const newBbox = [
          Number(bounds.getWest().toFixed(6)),
          Number(bounds.getSouth().toFixed(6)),
          Number(bounds.getEast().toFixed(6)),
          Number(bounds.getNorth().toFixed(6)),
        ];
        onBBoxChange(newBbox);
      });
    });

    // Event: Shape Deleted
    map.on(L.Draw.Event.DELETED, () => {
      onBBoxChange(null);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Synchronize drawn rectangle if bbox is set programmatically (e.g., sample preset)
  useEffect(() => {
    if (!mapRef.current || !drawnItemsRef.current) return;
    if (!bbox || bbox.length !== 4) {
      drawnItemsRef.current.clearLayers();
      return;
    }

    const [lonMin, latMin, lonMax, latMax] = bbox;
    const currentBounds = drawnItemsRef.current.getBounds();
    const isSame =
      currentBounds.isValid() &&
      Math.abs(currentBounds.getWest() - lonMin) < 0.0001 &&
      Math.abs(currentBounds.getSouth() - latMin) < 0.0001 &&
      Math.abs(currentBounds.getEast() - lonMax) < 0.0001 &&
      Math.abs(currentBounds.getNorth() - latMax) < 0.0001;

    if (!isSame) {
      drawnItemsRef.current.clearLayers();
      const rect = L.rectangle(
        [
          [latMin, lonMin],
          [latMax, lonMax],
        ],
        {
          color: '#00f2fe',
          weight: 2,
          fillColor: '#4facfe',
          fillOpacity: 0.2,
        }
      );
      drawnItemsRef.current.addLayer(rect);
      mapRef.current.fitBounds(rect.getBounds(), { padding: [30, 30] });
    }
  }, [bbox]);

  // Handle Satellite Thumbnail Image Overlay on Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (imageOverlayRef.current) {
      mapRef.current.removeLayer(imageOverlayRef.current);
      imageOverlayRef.current = null;
    }

    if (thumbnailUrl && bbox && bbox.length === 4 && showOverlay) {
      const [lonMin, latMin, lonMax, latMax] = bbox;
      const bounds = [
        [latMin, lonMin],
        [latMax, lonMax],
      ];

      const overlay = L.imageOverlay(thumbnailUrl, bounds, {
        opacity: overlayOpacity,
        interactive: true,
      });

      overlay.addTo(mapRef.current);
      imageOverlayRef.current = overlay;
    }
  }, [thumbnailUrl, bbox, showOverlay, overlayOpacity]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-container" />
      <div className="map-instructions">
        <span>Use the <strong>Rectangle tool</strong> (top left toolbar) to draw your Area of Interest (AOI).</span>
      </div>
    </div>
  );
};

export default MapComponent;
