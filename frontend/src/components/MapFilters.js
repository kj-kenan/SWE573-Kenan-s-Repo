import React, { useState, useEffect, useRef } from "react";

function MapFilters({ onFilterChange, onDistanceChange, userLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [distance, setDistance] = useState(30); // Default 30 km
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const tagInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  // Fetch tag suggestions from API
  const fetchTagSuggestions = async (query = "") => {
    if (query.length < 1) {
      setTagSuggestions([]);
      return;
    }

    setIsLoadingTags(true);
    try {
      const url = query
        ? `${API_BASE_URL}/api/tags/?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/api/tags/`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTagSuggestions(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      setTagSuggestions([]);
    } finally {
      setIsLoadingTags(false);
    }
  };

  // Load all tags when filter panel opens (for initial suggestions)
  useEffect(() => {
    if (isOpen && selectedTag.length === 0) {
      // Only fetch all tags if user hasn't typed anything yet
      fetchTagSuggestions("");
    }
  }, [isOpen]);

  // Fetch suggestions when user types
  useEffect(() => {
    if (selectedTag.length > 0) {
      const timer = setTimeout(() => {
        fetchTagSuggestions(selectedTag);
      }, 300); // Debounce for 300ms

      return () => clearTimeout(timer);
    } else {
      setTagSuggestions([]);
    }
  }, [selectedTag]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTagChange = (e) => {
    const newTag = e.target.value;
    setSelectedTag(newTag);
    setShowSuggestions(true);
    // Don't apply filters automatically - wait for Apply button
  };

  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
    setShowSuggestions(false);
  };

  const handleTagFocus = () => {
    if (tagSuggestions.length > 0 || selectedTag.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleDistanceChange = (e) => {
    const newDistance = parseInt(e.target.value);
    setDistance(newDistance);
    // Update circle radius immediately (for visual preview while dragging slider)
    if (onDistanceChange && userLocation) {
      onDistanceChange(newDistance);
    }
    // Don't apply filters automatically - wait for Apply button
  };

  const handleMinDateChange = (e) => {
    const newMinDate = e.target.value;
    setMinDate(newMinDate);
    // Don't apply filters automatically - wait for Apply button
  };

  const handleMaxDateChange = (e) => {
    const newMaxDate = e.target.value;
    setMaxDate(newMaxDate);
    // Don't apply filters automatically - wait for Apply button
  };

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange({
        tag: selectedTag || null,
        distance: distance || null,
        minDate: minDate || null,
        maxDate: maxDate || null,
        userLocation: userLocation || null,
      });
    }
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setSelectedTag("");
    setDistance(30);
    setMinDate("");
    setMaxDate("");
    setShowSuggestions(false);
    // Update circle radius when clearing
    if (onDistanceChange && userLocation) {
      onDistanceChange(30);
    }
    // Apply cleared filters immediately
    if (onFilterChange) {
      onFilterChange({
        tag: null,
        distance: 30,
        minDate: null,
        maxDate: null,
        userLocation: userLocation || null,
      });
    }
  };

  return (
    <div className="mb-4 bg-white rounded-lg shadow-md p-4 border border-amber-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-semibold text-amber-700 hover:text-amber-900"
      >
        <span>🔍 Map Filters</span>
        <span>{isOpen ? "▼" : "▶"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Tag Filter with Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-semibold text-amber-700 mb-2">
              Filter by Tag
            </label>
            <div className="relative">
              <input
                ref={tagInputRef}
                type="text"
                value={selectedTag}
                onChange={handleTagChange}
                onFocus={handleTagFocus}
                placeholder="Type tag name (e.g., Cooking, Tutoring, Gardening)"
                className="w-full p-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {isLoadingTags && (
                <div className="absolute right-2 top-2 text-gray-400 text-xs">
                  Loading...
                </div>
              )}
              {showSuggestions && tagSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {tagSuggestions.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTagSelect(tag)}
                      className="w-full text-left px-4 py-2 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              {showSuggestions &&
                selectedTag.length > 0 &&
                tagSuggestions.length === 0 &&
                !isLoadingTags && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg p-4 text-sm text-gray-500"
                  >
                    No matching tags found
                  </div>
                )}
            </div>
            {selectedTag && (
              <p className="mt-2 text-sm text-gray-600">
                Filtering by: <span className="font-semibold">{selectedTag}</span>
              </p>
            )}
          </div>

          {/* Distance Filter */}
          {userLocation && (
            <div>
              <label className="block text-sm font-semibold text-amber-700 mb-2">
                Distance: {distance} km from your location
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={distance}
                onChange={handleDistanceChange}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span>
                <span>30 km</span>
              </div>
            </div>
          )}

          {!userLocation && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2">
              <p className="text-sm text-amber-700">
                ⚠️ Enable location to use distance filtering
              </p>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-amber-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={minDate}
                onChange={handleMinDateChange}
                className="w-full p-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-amber-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={maxDate}
                onChange={handleMaxDateChange}
                className="w-full p-2 border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Apply and Clear Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold transition"
            >
              Apply Filters
            </button>
            {(selectedTag || distance !== 30 || minDate || maxDate) && (
              <button
                onClick={clearFilters}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold transition"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapFilters;
