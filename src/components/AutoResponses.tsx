'use client';

import CopyButton from './CopyButton';

interface AutoResponsesProps {
  responses: string[];
  quickReplies?: string[];
}

export default function AutoResponses({ responses, quickReplies = [] }: AutoResponsesProps) {
  if (!responses || responses.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-fade-in">
      <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
        <span>💬</span> Auto-Antworten auf deine Buttons
      </p>
      <div className="space-y-2">
        {responses.map((response, i) => (
          <div key={i} className="flex items-start gap-2 group">
            <div className="flex-1 bg-white rounded-lg p-3 border border-blue-100">
              {quickReplies[i] && (
                <p className="text-xs font-medium text-blue-600 mb-1">
                  Wenn jemand &ldquo;{quickReplies[i]}&rdquo; tippt:
                </p>
              )}
              <p className="text-sm text-gray-700">{response}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1 flex-shrink-0">
              <CopyButton text={response} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
