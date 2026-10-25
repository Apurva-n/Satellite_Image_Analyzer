import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix default marker icon issues in bundled environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// leaflet-draw attaches itself to window.L
if (typeof window !== 'undefined') {
  window.L = L;
}

// Fix leaflet-draw bug where 'type' was used without declaration in readableArea (ReferenceError in strict mode)
if (L.GeometryUtil) {
  L.GeometryUtil.readableArea = function (area, isMetric) {
    if (!area || isNaN(area)) return '';
    var km2 = area / 1000000;
    if (km2 >= 1) {
      return km2.toFixed(2) + ' km²';
    }
    var ha = area / 10000;
    if (ha >= 1) {
      return ha.toFixed(2) + ' ha';
    }
    return Math.round(area) + ' m²';
  };
}

export default L;
