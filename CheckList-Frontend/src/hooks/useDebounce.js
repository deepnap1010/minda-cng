import { useEffect, useState } from "react";

export const useDebounce = (value, delay = 800) => {
  const [debouncedValue, setDebouncedValue] = useState(value ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value ?? ""); 
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return {value: debouncedValue};
};
