'use client';

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#2D3348] flex items-center justify-center text-sm flex-shrink-0 mb-1">
        🤖
      </div>

      {/* Bubble with dots */}
      <div className="bg-[#1E2130] border border-[#2D3348] rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
        </div>
      </div>
    </div>
  );
}
