import React, { useEffect, useRef } from 'react';
import L from '../utils/leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

const MapComponent = ({
  bbox,
  onBBoxChange,
  thumbnailUrl,
  overlayOpacity = 0.85,
  showOverlay = true,
  flyToCoords = null,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const imageOverlayRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Basemaps: 
    // 1. Google Hybrid Satellite (Vivid high-res satellite with crisp roads & topography)
    const googleHybrid = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        attribution: '&copy; Google Satellite',
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }
    );

    // 2. Esri World Imagery (Standard Earth Observation Basemap)
    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }
    );

    // 3. CartoDB Dark Matter (High-tech Dark Mission Control theme)
    const cartoDark = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    );

    // 4. OpenStreetMap Standard
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });

    // Reference Overlays
    const cartoLabels = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    );

    // Default center Pune or bbox center
    let initialCenter = [18.5204, 73.8567];
    let initialZoom = 12;
    if (bbox && bbox.length === 4) {
      initialCenter = [(bbox[1] + bbox[3]) / 2, (bbox[0] + bbox[2]) / 2];
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      layers: [googleHybrid],
      zoomControl: false,
    });

    // Zoom control placed bottom-right so it never collides with layer chips or headers
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const baseMaps = {
      'Satellite Hybrid (Google)': googleHybrid,
      'Satellite Imagery (Esri)': esriSatellite,
      'Mission Control Dark (Carto)': cartoDark,
      'Street Map (OSM)': osm,
    };

    const overlayMaps = {
      'Road & City Labels': cartoLabels,
    };

    L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);

    // Feature group for drawn AOI rectangle
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
            color: '#22d3ee',
            weight: 2,
            fillColor: '#0891b2',
            fillOpacity: 0.18,
            dashArray: '4, 4',
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
      let west = bounds.getWest();
      let south = bounds.getSouth();
      let east = bounds.getEast();
      let north = bounds.getNorth();

      // Ensure minimum span so clipping geometry is never empty on micro-clicks
      if (Math.abs(east - west) < 0.005) {
        east = west + 0.02;
        west = west - 0.02;
      }
      if (Math.abs(north - south) < 0.005) {
        north = south + 0.02;
        south = south - 0.02;
      }

      const newBbox = [
        Number(west.toFixed(6)),
        Number(south.toFixed(6)),
        Number(east.toFixed(6)),
        Number(north.toFixed(6)),
      ];
      if (onBBoxChange) onBBoxChange(newBbox);
    });

    // Event: Shape Edited
    map.on(L.Draw.Event.EDITED, (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        const bounds = layer.getBounds();
        let west = bounds.getWest();
        let south = bounds.getSouth();
        let east = bounds.getEast();
        let north = bounds.getNorth();

        if (Math.abs(east - west) < 0.005) {
          east = west + 0.02;
          west = west - 0.02;
        }
        if (Math.abs(north - south) < 0.005) {
          north = south + 0.02;
          south = south - 0.02;
        }

        const newBbox = [
          Number(west.toFixed(6)),
          Number(south.toFixed(6)),
          Number(east.toFixed(6)),
          Number(north.toFixed(6)),
        ];
        if (onBBoxChange) onBBoxChange(newBbox);
      });
    });

    // Event: Shape Deleted
    map.on(L.Draw.Event.DELETED, () => {
      if (onBBoxChange) onBBoxChange(null);
    });

    mapRef.current = map;

    // Immediately trigger size calculation and initial bounds if bbox provided
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (bbox && bbox.length === 4) {
        const [lonMin, latMin, lonMax, latMax] = bbox;
        const rect = L.rectangle(
          [
            [latMin, lonMin],
            [latMax, lonMax],
          ],
          {
            color: '#22d3ee',
            weight: 2,
            fillColor: '#0891b2',
            fillOpacity: 0.18,
            dashArray: '4, 4',
          }
        );
        drawnItems.clearLayers();
        drawnItems.addLayer(rect);
        map.fitBounds(rect.getBounds(), { padding: [40, 40] });
      }
    }, 120);

    // ResizeObserver ensures Leaflet never stays blank when container dimensions change
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle flyTo when preset changes
  useEffect(() => {
    if (!mapRef.current || !flyToCoords) return;
    mapRef.current.flyTo(flyToCoords.center, flyToCoords.zoom || 12, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [flyToCoords]);

  // Synchronize drawn rectangle if bbox is set programmatically (e.g. preset click)
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
          color: '#22d3ee',
          weight: 2,
          fillColor: '#0891b2',
          fillOpacity: 0.18,
          dashArray: '4, 4',
        }
      );
      drawnItemsRef.current.addLayer(rect);
      mapRef.current.fitBounds(rect.getBounds(), { padding: [40, 40] });
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

      // Ensure view is centered on the satellite scene
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [thumbnailUrl, bbox, showOverlay, overlayOpacity]);

  return (
    <div
      ref={mapContainerRef}
      className="mc-map-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    />
  );
};

export default MapComponent;
