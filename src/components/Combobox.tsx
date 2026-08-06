"use client";

import { useState, useRef, useEffect } from "react";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  onInputChange?: (value: string) => void;
  disabled?: boolean;
}

export default function Combobox({ value, onChange, options, placeholder = "Select...", className = "", onInputChange, disabled = false }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex(
        highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(
        highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex]);
        setSearch(filteredOptions[highlightedIndex]);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`} ref={containerRef}>
      <input
        type="text"
        disabled={disabled}
        value={open ? search : value}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
          setHighlightedIndex(0);
          if (onInputChange) {
            onInputChange(e.target.value);
          }
          // If the user clears the input, clear the selection
          if (e.target.value === "") {
            onChange("");
          }
        }}
        onFocus={() => {
          setSearch(value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
      {/* Caret icon */}
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No results found.</div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                className={`w-full px-4 py-2 text-left text-sm text-gray-900 focus:outline-none ${highlightedIndex === idx ? 'bg-orange-100' : 'hover:bg-orange-50'}`}
                onClick={() => {
                  onChange(opt);
                  setSearch(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
