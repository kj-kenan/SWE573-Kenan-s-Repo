// frontend/src/components/TagSelector.js
import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react"; // npm i lucide-react

function TagSelector({ selectedTags, setSelectedTags }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  // Debounced Wikidata search
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If input is empty or too short, clear suggestions
    if (input.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    // Don't search if tag already selected
    if (selectedTags.includes(input.trim())) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Set loading state
    setLoading(true);
    setShowSuggestions(true);

    // Debounce API call (300ms)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/tags/wikidata/?q=${encodeURIComponent(input.trim())}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Wikidata API response:", data);
          // Filter out already selected tags
          const filtered = (data.results || []).filter(
            (item) => !selectedTags.includes(item.label)
          );
          console.log(`Filtered ${filtered.length} suggestions from ${data.results?.length || 0} results`);
          setSuggestions(filtered);
        } else {
          console.error("Wikidata API error:", response.status, response.statusText);
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching Wikidata suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [input, selectedTags, API_BASE_URL]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setSelectedIndex(-1);
  };

  const addTag = (tagLabel) => {
    if (tagLabel && !selectedTags.includes(tagLabel)) {
      setSelectedTags([...selectedTags, tagLabel]);
      setInput("");
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
      setShowSuggestions(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      setShowSuggestions(true);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        addTag(suggestions[selectedIndex].label);
      } else if (input.trim() && !selectedTags.includes(input.trim())) {
        // Allow manual tag entry
        addTag(input.trim());
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicks on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">Semantic Tags</label>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="flex items-center bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-2 text-amber-700 hover:text-red-500"
              type="button"
              aria-label={`Remove ${tag}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      {/* Input + suggestions */}
      <div className="relative" ref={suggestionsRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleInputBlur}
            placeholder="Start typing to search Wikidata (e.g. 'cooking', 'tutoring')"
            className="block w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {loading && (
            <div className="absolute right-2 top-2 text-gray-400 text-xs">
              Loading...
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (suggestions.length > 0 || loading || (input.trim().length >= 2 && !loading)) && (
          <ul className="absolute z-50 w-full bg-white border border-amber-200 rounded mt-1 shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <li className="px-3 py-2 text-gray-500 text-sm">Searching...</li>
            ) : suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <li
                  key={item.wikidata_id || index}
                  onClick={() => addTag(item.label)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? "bg-amber-100"
                      : "hover:bg-amber-50"
                  }`}
                >
                  <div className="font-medium text-gray-800">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </li>
              ))
            ) : input.trim().length >= 2 ? (
              <li className="px-3 py-2 text-gray-500 text-sm">
                No results found. Press Enter to add "{input.trim()}" as a tag.
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TagSelector;
