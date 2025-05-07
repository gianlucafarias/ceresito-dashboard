"use client";

interface KeyValueDisplayProps {
  data: Record<string, any>;
  className?: string;
  omitKeys?: string[];
}

export function KeyValueDisplay({ data, className, omitKeys = [] }: KeyValueDisplayProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm ${className || ''}`}>
      {Object.entries(data)
        .filter(([key]) => !omitKeys.includes(key))
        .map(([key, value]) => (
          <div key={key} className="flex">
            <span className="font-semibold mr-2 capitalize">{key.replace(/_/g, ' ')}:</span>
            <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value !== null && value !== undefined ? String(value) : 'N/A'}</span>
          </div>
        ))}
    </div>
  );
} 