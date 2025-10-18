// components/ChatMessage.jsx
export default function ChatMessage({ msg, isUser }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[70%] p-3 rounded-xl shadow-md ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-200 text-gray-900 rounded-bl-none"
        }`}
      >
        {/* Always show text */}
        {msg.text && <p className="mb-2">{msg.text}</p>}

        {/* If movies are present, show them */}
        {msg.movies && (
          <div className="grid gap-3">
            {msg.movies.map((movie, idx) => (
              <div
                key={idx}
                className="bg-white text-gray-900 p-3 rounded-lg shadow flex gap-3"
              >
                {movie.poster && (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-20 h-28 object-cover rounded-md"
                  />
                )}
                <div className="flex flex-col">
                  <h4 className="font-semibold">
                    {movie.title} ({movie.release_date})
                  </h4>
                  <p className="text-sm text-gray-600">⭐ {movie.rating}</p>
                  <p className="text-xs mt-1 line-clamp-3">{movie.overview}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
