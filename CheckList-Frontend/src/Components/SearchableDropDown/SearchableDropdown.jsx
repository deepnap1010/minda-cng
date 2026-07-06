import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react"; // 


const SearchableSelect = ({
  placeholder = "Select...",
  options = [],
  value,
  onChange,
  disabled = false,
  error,
  getOptionLabel,
  getOptionValue,
  name
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


  useEffect(() => {
  if (!value) {
    setSearchText("");
    return;
  }
  const selected = options.find(
    (opt) => getOptionValue(opt) === value
  );
  if (selected) {
    setSearchText(getOptionLabel(selected));
  }
  }, [value, options]);


  const filteredOptions =

    searchText === ""
      ? options
      : options?.filter((opt) =>
          getOptionLabel(opt)
            ?.toLowerCase()
            ?.startsWith(searchText?.toLowerCase())
        );

  return (
    <div className="relative w-full" ref={wrapperRef}>
     
      <div
        className={`flex items-center w-full px-2.5 py-1.5 border rounded-lg cursor-pointer ${
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:border-blue-400"
        } border-gray-300`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <input
          type="text"
          placeholder={placeholder}
          name={name}
          value={searchText}
          disabled={disabled}
          onChange={(e) => {
            setSearchText(e.target.value);
            setOpen(true);
          }}
          className="w-full outline-none cursor-pointer"
        />
        <ChevronDown
        onClick={(open)=>setOpen(!open)}
        className="ml-2 w-5 h-5 text-gray-500" />
      </div>

     
      {open && (
        <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={getOptionValue(opt)}
                onMouseDown={() => {
                  onChange(getOptionValue(opt));
                  setSearchText(getOptionLabel(opt));
                  setOpen(false);
                }}
                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
              >
                {getOptionLabel(opt)}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-500">No data found</li>
          )}
        </ul>
      )}

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
