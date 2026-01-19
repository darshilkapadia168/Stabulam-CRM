import { useState, useEffect, useRef } from "react";
import { MapPin, X, Navigation, Target, Loader, Map } from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const AddLocationModal = ({ isOpen, onClose, onSuccess, editLocation }) => {
  const [formData, setFormData] = useState({
    locationName: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: "500",
    locationType: "OFFICE",
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationMethod, setLocationMethod] = useState("manual");
  const [showMap, setShowMap] = useState(false);
  
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Load Leaflet CSS and JS
  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (showMap && !leafletMapRef.current) {
          initializeMap();
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  // Initialize map when showMap changes
  useEffect(() => {
    if (showMap && window.L && mapRef.current && !leafletMapRef.current) {
      setTimeout(() => initializeMap(), 100);
    }
  }, [showMap]);

  // Populate form when editing
  useEffect(() => {
    if (editLocation) {
      setFormData({
        locationName: editLocation.locationName,
        address: editLocation.address || "",
        latitude: editLocation.latitude.toString(),
        longitude: editLocation.longitude.toString(),
        radius: editLocation.radius.toString(),
        locationType: editLocation.locationType,
      });
    } else {
      resetForm();
    }
  }, [editLocation]);

  const resetForm = () => {
    setFormData({
      locationName: "",
      address: "",
      latitude: "",
      longitude: "",
      radius: "500",
      locationType: "OFFICE",
    });
    setLocationMethod("manual");
    setShowMap(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Auto-show map when coordinates are entered manually
    if (e.target.name === 'latitude' || e.target.name === 'longitude') {
      const lat = e.target.name === 'latitude' ? parseFloat(e.target.value) : parseFloat(formData.latitude);
      const lng = e.target.name === 'longitude' ? parseFloat(e.target.value) : parseFloat(formData.longitude);
      
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        // Auto-show map when valid coordinates are entered
        if (!showMap) {
          setShowMap(true);
          // Wait for map container to be rendered, then initialize
          setTimeout(() => {
            if (window.L && mapRef.current && !leafletMapRef.current) {
              initializeMap();
            }
          }, 200);
        } else if (leafletMapRef.current) {
          updateMapMarker(lat, lng);
        }
      }
    }
    
    // Update radius circle
    if (e.target.name === 'radius' && circleRef.current) {
      circleRef.current.setRadius(parseInt(e.target.value));
    }
  };

  const initializeMap = () => {
    if (!window.L || !mapRef.current || leafletMapRef.current) return;

    const lat = parseFloat(formData.latitude) || 23.0225;
    const lng = parseFloat(formData.longitude) || 72.5714;

    // Create map with higher default zoom for more detail
    const map = window.L.map(mapRef.current).setView([lat, lng], 18);
    leafletMapRef.current = map;

    // Add detailed satellite + street hybrid layer from multiple providers
    // You can switch between different map styles by uncommenting one:
    
    // Option 1: Google Maps Hybrid (Satellite + Roads/Labels) - Most Detailed
    window.L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps',
      maxZoom: 22,
      minZoom: 1,
    }).addTo(map);

    // Option 2: OpenStreetMap with high detail (Uncomment to use)
    // window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   attribution: '© OpenStreetMap contributors',
    //   maxZoom: 19,
    // }).addTo(map);

    // Option 3: Esri World Imagery (Satellite) (Uncomment to use)
    // window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    //   attribution: '© Esri',
    //   maxZoom: 20,
    // }).addTo(map);

    // Add custom marker icon with shadow for better visibility
    const customIcon = window.L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTYgMEMxMC4yIDAgNCA1LjIgNCAxMmMwIDkgMTIgMzYgMTIgMzZzMTItMjcgMTItMzZjMC02LjgtNS4yLTEyLTEyLTEyeiIgZmlsbD0iI2VmNDQ0NCIvPgogIDxjaXJjbGUgY3g9IjE2IiBjeT0iMTIiIHI9IjYiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
      iconSize: [32, 48],
      iconAnchor: [16, 48],
      popupAnchor: [0, -48]
    });

    // Add draggable marker with custom icon
    const marker = window.L.marker([lat, lng], { 
      draggable: true,
      icon: customIcon
    }).addTo(map);
    markerRef.current = marker;

    // Add radius circle with better styling
    const circle = window.L.circle([lat, lng], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 2,
      radius: parseInt(formData.radius)
    }).addTo(map);
    circleRef.current = circle;

    // Add zoom controls
    map.zoomControl.setPosition('topright');

    // Add scale control
    window.L.control.scale({ imperial: false, metric: true }).addTo(map);

    // Update coordinates when marker is dragged
    marker.on('dragend', function(e) {
      const position = e.target.getLatLng();
      setFormData(prev => ({
        ...prev,
        latitude: position.lat.toFixed(6),
        longitude: position.lng.toFixed(6)
      }));
      circle.setLatLng(position);
    });

    // Click on map to place marker
    map.on('click', function(e) {
      const { lat, lng } = e.latlng;
      setFormData(prev => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      }));
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
    });

    // CRITICAL: Fix black map display issue
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  };

  const updateMapMarker = (lat, lng) => {
    if (markerRef.current && circleRef.current && leafletMapRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      leafletMapRef.current.setView([lat, lng], leafletMapRef.current.getZoom());
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          
          setFormData({
            ...formData,
            latitude: lat,
            longitude: lng,
          });
          
          if (leafletMapRef.current) {
            updateMapMarker(parseFloat(lat), parseFloat(lng));
          }
          
          setGettingLocation(false);
          setLocationMethod("current");
        },
        (error) => {
          console.error("Location error:", error);
          alert("Unable to get current location. Please enter manually.");
          setGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        locationName: formData.locationName.trim(),
        address: formData.address.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius),
        locationType: formData.locationType,
      };

      if (editLocation) {
        await axios.put(
          `${API_BASE}/workplace-locations/${editLocation._id}`,
          payload,
          axiosConfig
        );
        alert("Location updated successfully!");
      } else {
        await axios.post(`${API_BASE}/workplace-locations`, payload, axiosConfig);
        alert("Location created successfully!");
      }

      onSuccess();
      resetForm();
    } catch (error) {
      console.error("Error saving location:", error);
      alert(error.response?.data?.message || "Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up map
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    }
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MapPin size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">
                {editLocation ? "Edit Location" : "Add New Location"}
              </h2>
              <p className="text-blue-100 text-sm">Configure workplace location and geofencing</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            type="button"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div>
              {/* Location Name */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Head Office, Branch 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Address */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Full address of the location"
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location Type */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="locationType"
                  value={formData.locationType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OFFICE">Office</option>
                  <option value="BRANCH">Branch</option>
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="REMOTE">Remote</option>
                  <option value="CLIENT_SITE">Client Site</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Location Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Set Coordinates <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMethod("manual");
                      setShowMap(false);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      locationMethod === "manual" && !showMap
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <Target size={20} className="mx-auto mb-1 text-blue-600" />
                    <p className="font-semibold text-xs text-gray-700">Manual Entry</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMap(true);
                      setLocationMethod("map");
                      if (!leafletMapRef.current) {
                        setTimeout(() => initializeMap(), 100);
                      }
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      showMap
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <Map size={20} className="mx-auto mb-1 text-blue-600" />
                    <p className="font-semibold text-xs text-gray-700">Use Map</p>
                  </button>
                </div>
              </div>

              {/* Current Location Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full p-3 rounded-lg border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {gettingLocation ? (
                    <>
                      <Loader size={20} className="text-blue-600 animate-spin" />
                      <span className="font-semibold text-sm text-blue-700">Getting location...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={20} className="text-blue-600" />
                      <span className="font-semibold text-sm text-blue-700">Use My Current Location</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Automatically fill coordinates with your current position
                </p>
              </div>

              {/* Coordinates */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                    placeholder="23.0225"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                    placeholder="72.5714"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Geofence Radius */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Geofence Radius (meters) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    name="radius"
                    min="50"
                    max="2000"
                    step="50"
                    value={formData.radius}
                    onChange={handleChange}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg min-w-[120px]">
                    <span className="text-2xl font-bold text-blue-600">{formData.radius}</span>
                    <span className="text-sm text-gray-600">m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Map */}
            <div>
              {showMap || (formData.latitude && formData.longitude) ? (
                <div className="h-full min-h-[500px] rounded-lg overflow-hidden border-2 border-gray-300">
                  <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />
                </div>
              ) : (
                <div className="h-full min-h-[500px] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <div className="text-center p-8">
                    <Map size={64} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map Preview</h3>
                    <p className="text-gray-500 mb-4">Map will appear when you:</p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>• Click "Use Map" button</p>
                      <p>• Enter latitude & longitude manually</p>
                      <p>• Use current location</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tips:</strong> Use the map to visually select location, GPS for current position, or enter coordinates manually from Google Maps.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : editLocation ? "Update Location" : "Add Location"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLocationModal;