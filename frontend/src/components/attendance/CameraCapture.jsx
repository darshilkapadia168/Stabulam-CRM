import { useState, useRef, useEffect } from "react";
import { Camera, X, RotateCw, Check, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/api`;

const CameraCapture = ({ isOpen, onClose, onCapture, actionType }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(null);
  const [workplaceLocation, setWorkplaceLocation] = useState(null);

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Get user location
  useEffect(() => {
    if (isOpen) {
      getLocation();
    }
  }, [isOpen]);

  const getLocation = () => {
    setLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLocation({
            latitude: lat,
            longitude: lng,
            accuracy: position.coords.accuracy,
          });
          setLoadingLocation(false);
          setLocationError(null);
          
          // Verify location against workplace locations
          verifyLocationWithWorkplace(lat, lng);
        },
        (error) => {
          setLoadingLocation(false);
          let errorMessage = "Unable to get location. ";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Permission denied. Please allow location access.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Request timed out.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
          }
          
          setLocationError(errorMessage);
          console.error("Location error:", error.code, error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else {
      setLoadingLocation(false);
      setLocationError("Geolocation is not supported by your browser");
    }
  };

  // Verify location with workplace locations
  const verifyLocationWithWorkplace = async (lat, lng) => {
    setVerifyingLocation(true);
    try {
      const res = await axios.post(
        `${API_BASE}/workplace-locations/verify`,
        { latitude: lat, longitude: lng },
        axiosConfig
      );

      if (res.data.isWithinRange) {
        setLocationVerified(true);
        setWorkplaceLocation(res.data.data);
      } else {
        setLocationVerified(false);
        setWorkplaceLocation(null);
        if (res.data.nearestLocation) {
          setLocationError(
            `You are not within any workplace location. Nearest: ${res.data.nearestLocation.locationName} (${res.data.nearestLocation.distance}m away)`
          );
        } else {
          setLocationError("You are not within any workplace location");
        }
      }
    } catch (error) {
      console.error("Location verification error:", error);
      setLocationVerified(false);
    } finally {
      setVerifyingLocation(false);
    }
  };

  // Start camera
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        setCapturedImage(blob);
        stopCamera();
      }, "image/jpeg", 0.9);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (!location) {
      alert("Location is required. Please enable location services.");
      return;
    }

    if (!locationVerified) {
      const proceed = window.confirm(
        "Warning: You are not within any registered workplace location. Do you want to proceed anyway? This may require approval."
      );
      if (!proceed) return;
    }

    if (!capturedImage) {
      alert("Please capture your photo first.");
      return;
    }

    onCapture(capturedImage, {
      ...location,
      officeTag: workplaceLocation?.locationName || "Unknown Location",
      verified: locationVerified,
    });
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setLocation(null);
    setLocationError(null);
    setLocationVerified(null);
    setWorkplaceLocation(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Camera size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                {actionType === "clockIn" ? "Clock In" : "Clock Out"}
              </h2>
              <p className="text-blue-100 text-sm">Capture your photo and verify location</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Location Status */}
          <div className={`mb-4 p-3 rounded-lg border-2 ${
            verifyingLocation 
              ? "bg-blue-50 border-blue-200"
              : locationVerified 
              ? "bg-green-50 border-green-300" 
              : locationVerified === false
              ? "bg-red-50 border-red-300"
              : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-start gap-3">
              {verifyingLocation ? (
                <div className="animate-spin mt-0.5">
                  <MapPin size={20} className="text-blue-500" />
                </div>
              ) : locationVerified ? (
                <CheckCircle size={20} className="text-green-500 mt-0.5" />
              ) : locationVerified === false ? (
                <AlertCircle size={20} className="text-red-500 mt-0.5" />
              ) : (
                <MapPin size={20} className="text-gray-400 mt-0.5" />
              )}
              
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">
                  {loadingLocation
                    ? "Getting your location..."
                    : verifyingLocation
                    ? "Verifying location..."
                    : locationVerified
                    ? "✓ Location Verified"
                    : locationVerified === false
                    ? "⚠ Not Within Workplace"
                    : "Location Status"}
                </p>
                
                {workplaceLocation && (
                  <p className="text-sm text-green-700 font-semibold mt-1">
                    📍 {workplaceLocation.locationName}
                  </p>
                )}
                
                {location && (
                  <p className="text-xs text-gray-500 mt-1">
                    Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                  </p>
                )}
                
                {locationError && (
                  <p className="text-xs text-red-600 mt-2 flex items-start gap-1">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{locationError}</span>
                  </p>
                )}
              </div>
              
              {!location && !loadingLocation && (
                <button
                  onClick={getLocation}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 whitespace-nowrap"
                >
                  Retry
                </button>
              )}
            </div>
          </div>

          {/* Warning if not verified */}
          {locationVerified === false && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠ Warning:</strong> You can still clock in, but this may require admin approval since you're outside the registered workplace area.
              </p>
            </div>
          )}

          {/* Camera View */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={URL.createObjectURL(capturedImage)}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Location badge overlay */}
            {locationVerified && workplaceLocation && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                <CheckCircle size={14} />
                {workplaceLocation.locationName}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {!capturedImage ? (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={!location}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Camera size={20} />
                  Capture Photo
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={retakePhoto}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCw size={20} />
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!location}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed ${
                    locationVerified
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  }`}
                >
                  <Check size={20} />
                  Confirm {actionType === "clockIn" ? "Clock In" : "Clock Out"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;