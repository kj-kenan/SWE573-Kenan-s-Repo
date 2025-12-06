import React, { useState } from "react";

const PREDEFINED_TAGS = [
  "On Time",
  "Good Communication",
  "Friendly",
  "Reliable",
  "Professional",
  "High Quality Work",
  "Efficient",
  "Organized",
  "Respectful",
  "Above and Beyond",
];

function RatingModal({ handshake, partnerName, onClose, onSubmit, isOpen }) {
  const [score, setScore] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 3) {
        setSelectedTags([...selectedTags, tag]);
      } else {
        setError("You can select at most 3 tags.");
      }
    }
  };

  const handleSubmit = async () => {
    setError("");
    
    if (selectedTags.length < 1) {
      setError("Please select at least 1 tag.");
      return;
    }

    if (score < 1 || score > 10) {
      setError("Please select a score between 1 and 10.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        score,
        tags: selectedTags,
        comment: comment.trim(),
      });
      // Reset form
      setScore(5);
      setSelectedTags([]);
      setComment("");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to submit rating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-amber-700">
              Rate {partnerName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Score Selector */}
            <div>
              <label className="block text-sm font-semibold text-amber-700 mb-3">
                Score (1-10): {score}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="w-full h-3 bg-amber-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {[...Array(10)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setScore(i + 1)}
                    className={`w-8 h-8 rounded-full font-bold transition ${
                      i + 1 <= score
                        ? "bg-amber-500 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Multi-select */}
            <div>
              <label className="block text-sm font-semibold text-amber-700 mb-3">
                Tags (select up to 3): {selectedTags.length}/3
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PREDEFINED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    disabled={!selectedTags.includes(tag) && selectedTags.length >= 3}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      selectedTags.includes(tag)
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } ${
                      !selectedTags.includes(tag) && selectedTags.length >= 3
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-semibold"
                    >
                      {tag} ×
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-amber-700 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                className="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading || selectedTags.length < 1}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit Rating"}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;

