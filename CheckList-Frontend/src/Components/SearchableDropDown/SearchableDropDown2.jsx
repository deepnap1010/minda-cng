import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { useCheckItem } from "../../hooks/useCheckItem";


const SearchableSelect = ({
    placeholder = "Select...",
    options = [],
    value,
    onChange,
    disabled = false,
    error,
    getOptionLabel,
    getOptionValue,
    type,
    getOptionId, 
}) => {
    const [searchText, setSearchText] = useState("");
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const { removeLabel } = useCheckItem();

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
        searchText.trim() === ""
            ? options
            : options.filter((opt) =>
                getOptionLabel(opt)
                    .toLowerCase()
                    .startsWith(searchText.toLowerCase())
            );


    function handleRemove(id, value) {
        const confirmed = window.confirm("Are you sure you want to remove this item?");
        if (!confirmed) return;
       

        removeLabel.mutate({
            id,
            body: { [type]: value }
        });
    }


    return (
        <div className="relative w-full" ref={wrapperRef}>

            <div
                className={`flex items-center w-full px-4 py-3 border rounded-lg cursor-pointer ${disabled
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-white hover:border-blue-400"
                    } border-gray-300`}
                onClick={() => !disabled && setOpen((prev) => !prev)}
            >
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchText}
                    disabled={disabled}
                    onChange={(e) => {
                        setSearchText(e.target.value);
                        setOpen(true);
                    }}
                    className="w-full outline-none cursor-pointer"
                />
                <ChevronDown
                    onClick={(open) => setOpen(!open)}
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
                                className="px-4 py-2 flex flex-row justify-between gap-2 items-center hover:bg-blue-100 cursor-pointer"
                            >
                                <span className="truncate">{getOptionLabel(opt)}</span>

                                <X
                                    size={18}
                                    className="text-gray-500 cursor-pointer hover:text-blue-500 hover:scale-110 transition"
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleRemove(getOptionId(opt), getOptionValue(opt));
                                    }}
                                />
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
