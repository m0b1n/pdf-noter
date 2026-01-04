import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for localStorage persistence
 * @param {string} key - The localStorage key
 * @param {any} initialValue - The initial value if no value exists in localStorage
 * @returns {[any, Function]} - The stored value and a setter function
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Handle the case where item might be "undefined" string from previous buggy version
      if (item === "undefined") return initialValue;
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const lastKeyRef = useRef(key);

  useEffect(() => {
    if (key !== lastKeyRef.current) {
      try {
        const item = window.localStorage.getItem(key);
        const newValue =
          item !== null && item !== "undefined"
            ? JSON.parse(item)
            : initialValue;
        setStoredValue(newValue);
        lastKeyRef.current = key;
      } catch (error) {
        console.error(`Error loading ${key} from localStorage on key change:`, error);
        setStoredValue(initialValue);
        lastKeyRef.current = key;
      }
    }
  }, [key, initialValue]);

  useEffect(() => {
    if (key === lastKeyRef.current) {
      try {
        if (storedValue === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(storedValue));
        }
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

