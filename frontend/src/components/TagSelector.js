// frontend/src/components/TagSelector.js
import React, { useState } from "react";
import { X } from "lucide-react"; // npm i lucide-react

const predefinedTags = [
  "Cooking", "Tutoring", "Gardening", "Storytelling",
  "Errands", "Technology Help", "Music Lessons", "Pet Care",
];

function TagSelector({ selectedTags, setSelectedTags }) {
  const [input, setInput] = useState("");
  const [filteredTags, setFilteredTags] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setFilteredTags(
      predefinedTags.filter(
        (tag) =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !selectedTags.includes(tag)
      )
    );
  };

  const addTag = (tag) => {
    setSelectedTags([...selectedTags, tag]);
    setInput("");
    setFilteredTags([]);
  };

  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">Semantic Tags</label>

      {/* Seçili taglar */}
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

      {/* Input + öneriler */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Start typing (e.g. 'cook')"
          className="block w-full p-2 border rounded"
        />
        {filteredTags.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-amber-200 rounded mt-1 shadow">
            {filteredTags.map((tag) => (
              <li
                key={tag}
                onClick={() => addTag(tag)}
                className="px-3 py-2 hover:bg-amber-100 cursor-pointer"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TagSelector;
