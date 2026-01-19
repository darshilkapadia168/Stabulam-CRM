import { useState, useEffect } from "react";
import { MapPin, Plus, Edit2, Trash2, Navigation, Check, X, Search } from "lucide-react";
import AddLocationModal from "../components/attendance/AddLocationModal";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const WorkplaceLocations = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("all"); // all, active, inactive

  const token = localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch all locations
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/workplace-locations`, axiosConfig);
      setLocations(res.data.data);
      setFilteredLocations(res.data.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
      alert("Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Filter locations
  useEffect(() => {
    let filtered = locations;

    // Filter by active status
    if (filterActive === "active") {
      filtered = filtered.filter((loc) => loc.isActive);
    } else if (filterActive === "inactive") {
      filtered = filtered.filter((loc) => !loc.isActive);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (loc) =>
          loc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLocations(filtered);
  }, [searchQuery, filterActive, locations]);

  // Delete location
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await axios.delete(`${API_BASE}/workplace-locations/${id}`, axiosConfig);
      alert("Location deleted successfully");
      fetchLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      alert("Failed to delete location");
    }
  };

  // Toggle active status
  const toggleActive = async (location) => {
    try {
      await axios.put(
        `${API_BASE}/workplace-locations/${location._id}`,
        { isActive: !location.isActive },
        axiosConfig
      );
      fetchLocations();
    } catch (error) {
      console.error("Error updating location:", error);
      alert("Failed to update location");
    }
  };

  const handleLocationAdded = () => {
    setShowAddModal(false);
    setEditingLocation(null);
    fetchLocations();
  };

  const openEditModal = (location) => {
    setEditingLocation(location);
    setShowAddModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <MapPin size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Workplace Locations</h1>
              <p className="text-sm text-gray-500">Manage office locations and geofencing</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingLocation(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Plus size={20} />
            Add Location
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {["all", "active", "inactive"].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterActive(filter)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  filterActive === filter
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Total Locations</p>
              <p className="text-2xl font-bold text-blue-700">{locations.length}</p>
            </div>
            <MapPin size={32} className="text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Active</p>
              <p className="text-2xl font-bold text-green-700">
                {locations.filter((l) => l.isActive).length}
              </p>
            </div>
            <Check size={32} className="text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Inactive</p>
              <p className="text-2xl font-bold text-gray-700">
                {locations.filter((l) => !l.isActive).length}
              </p>
            </div>
            <X size={32} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Locations List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading locations...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No locations found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filterActive !== "all"
              ? "Try adjusting your filters"
              : "Get started by adding your first workplace location"}
          </p>
          {!searchQuery && filterActive === "all" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Add Location
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <div
              key={location._id}
              className={`bg-white rounded-xl border-2 p-5 transition-all hover:shadow-lg ${
                location.isActive ? "border-green-200" : "border-gray-200"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{location.locationName}</h3>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      location.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {location.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MapPin size={20} className="text-blue-600" />
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-2 mb-4">
                {location.address && (
                  <p className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="font-semibold min-w-[60px]">Address:</span>
                    <span className="flex-1">{location.address}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold min-w-[60px]">Type:</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                    {location.locationType}
                  </span>
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold min-w-[60px]">Radius:</span>
                  <span className="text-blue-600 font-semibold">{location.radius}m</span>
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <Navigation size={12} />
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => toggleActive(location)}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                    location.isActive
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {location.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => openEditModal(location)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(location._id, location.locationName)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddLocationModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingLocation(null);
        }}
        onSuccess={handleLocationAdded}
        editLocation={editingLocation}
      />
    </div>
  );
};

export default WorkplaceLocations;