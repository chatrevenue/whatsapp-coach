'use client';

import CopyButton from './CopyButton';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  showCopy?: boolean;
}

export default function QuickReplies({ replies, onSelect, showCopy = true }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-end mt-2 px-2 animate-fade-in">
      {replies.map((reply, index) => (
        <div key={index} className="flex items-center gap-1 group">
          <button
            onClick={() => onSelect(reply)}
            className="
              px-4 py-2 rounded-full border-2 border-whatsapp-green text-whatsapp-green
              text-sm font-medium bg-white
              hover:bg-whatsapp-green hover:text-white
              active:scale-95
              transition-all duration-200
              whitespace-nowrap
              shadow-sm
            "
          >
            {reply}
          </button>
          {showCopy && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={reply} size="sm" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
