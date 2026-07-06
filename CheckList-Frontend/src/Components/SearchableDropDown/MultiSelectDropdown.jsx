import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

const MultiSelectDropdown = ({
  placeholder = "Select...",
  options = [],
  value = [],
  onChange,
  disabled = false,
  error,
  getOptionLabel,
  getOptionValue,
  searchFields = [], // Array of field names to search in (e.g., ['full_name', 'user_id', 'email'])
}) => {
  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptions = Array.isArray(value) ? value : [];
  const selectedValues = selectedOptions.map((val) => {
    const option = options.find((opt) => getOptionValue(opt) === val);
    return option ? getOptionLabel(option) : val;
  });

  const filteredOptions =
    searchText.trim() === ""
      ? options
      : options.filter((opt) => {
          const searchLower = searchText.toLowerCase();

          // Search in label (formatted display text)
          const label = getOptionLabel(opt).toLowerCase();
          if (label.includes(searchLower)) {
            return true;
          }

          // Search in specified fields if provided
          if (searchFields.length > 0) {
            return searchFields.some((field) => {
              const fieldValue = opt[field];
              if (fieldValue) {
                return String(fieldValue).toLowerCase().includes(searchLower);
              }
              return false;
            });
          }

          // Fallback: search in all string/number properties of the option
          return Object.values(opt).some((val) => {
            if (val && typeof val === "string") {
              return val.toLowerCase().includes(searchLower);
            }
            if (val && typeof val === "number") {
              return String(val).includes(searchText);
            }
            return false;
          });
        });

  const handleToggle = (optionValue) => {
    const currentValues = Array.isArray(value) ? [...value] : [];
    const index = currentValues.indexOf(optionValue);

    if (index > -1) {
      // Remove if already selected
      currentValues.splice(index, 1);
    } else {
      // Add if not selected
      currentValues.push(optionValue);
    }

    onChange(currentValues);
    setSearchText("");
  };

  const handleRemove = (optionValue, e) => {
    e.stopPropagation();
    const currentValues = Array.isArray(value) ? [...value] : [];
    const newValues = currentValues.filter((val) => val !== optionValue);
    onChange(newValues);
  };

  const isSelected = (optionValue) => {
    return Array.isArray(value) && value.includes(optionValue);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        className={`flex flex-wrap items-center w-full px-3 py-2 border rounded-lg gap-2 ${
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:border-blue-400 cursor-text"
        } border-gray-300 ${open ? "border-blue-500 ring-2 ring-blue-100" : ""}`}
        onClick={(e) => {
          if (!disabled && e.target.tagName !== "INPUT") {
            setOpen((prev) => !prev);
          }
        }}
      >
        <div className="flex w-full gap-2 items-center flex-wrap">
          {selectedValues.map((label, idx) => {
            const optionValue = selectedOptions[idx];
            return (
              <span
                key={optionValue}
                className="inline-flex items-center gap-1 whitespace-nowrap bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex-shrink-0"
              >
                {label}
                {!disabled && (
                  <X
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(optionValue, e);
                    }}
                    className="cursor-pointer hover:text-red-600"
                  />
                )}
              </span>
            );
          })}
          <input
            type="text"
            placeholder={
              selectedValues.length === 0 ? placeholder : "Search..."
            }
            value={searchText}
            disabled={disabled}
            onChange={(e) => {
              setSearchText(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (!disabled) {
                setOpen(true);
              }
            }}
            className="flex-1 outline-none min-w-[80px] text-sm bg-transparent"
            onClick={(e) => e.stopPropagation()}
          />
          <ChevronDown
            className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform cursor-pointer ${
              open ? "rotate-180" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                setOpen((prev) => !prev);
              }
            }}
          />
        </div>
      </div>

      {open && (
        <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const optValue = getOptionValue(opt);
              const optLabel = getOptionLabel(opt);
              return (
                <li
                  key={optValue}
                  onClick={() => handleToggle(optValue)}
                  className={`px-4 py-2 cursor-pointer flex items-center gap-2 ${
                    isSelected(optValue)
                      ? "bg-blue-100 text-blue-800"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected(optValue)}
                    readOnly
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 pointer-events-none"
                  />
                  <span>{optLabel}</span>
                </li>
              );
            })
          ) : (
            <li className="px-4 py-2 text-gray-500">No data found</li>
          )}
        </ul>
      )}

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default MultiSelectDropdown;
