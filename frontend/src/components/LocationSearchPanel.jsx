const LocationSearchPanel = ({
  title,
  suggestions = [],
  isLoading = false,
  onSelect,
  onClose,
}) => {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-600">
            {title}
          </p>
          <p className="text-sm text-gray-500">
            {isLoading ? "Searching locations..." : "Choose a suggested place"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
        >
          Close
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="px-4 py-5 text-sm text-gray-500">
            {isLoading ? "Loading suggestions..." : "No suggestions yet."}
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion.place_id}
              onClick={() => onSelect(suggestion)}
              className="flex w-full items-start gap-3 border-b border-gray-100 px-4 py-4 text-left transition hover:bg-yellow-50"
            >
              <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-sm font-bold text-yellow-700">
                {suggestion.description?.charAt(0) || "?"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900">
                  {suggestion.structured_formatting?.main_text ||
                    suggestion.description}
                </span>
                <span className="mt-1 block truncate text-xs text-gray-500">
                  {suggestion.structured_formatting?.secondary_text ||
                    suggestion.description}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default LocationSearchPanel;
