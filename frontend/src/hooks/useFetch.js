import { useState, useEffect, useCallback } from 'react';

// Default San Francisco coordinates (moved outside to prevent recreation and infinite loops)
const DEFAULT_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194
};

/**
 * Custom hook for handling data fetching with loading, error states, and location fallback
 * @param {Function} fetchFunction - The async function to fetch data
 * @param {Array} dependencies - Dependencies for the useCallback
 * @param {Object} options - Configuration options
 * @param {Function} options.getMockData - Function to get mock data on error
 * @param {boolean} options.useLocation - Whether to use geolocation with SF fallback
 * @param {boolean} options.autoFetch - Whether to automatically fetch on mount
 */
export const useFetch = (fetchFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    getMockData,
    useLocation = false,
    autoFetch = true
  } = options;

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  };

  const fetchData = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      let location = null;
      
      if (useLocation) {
        try {
          const position = await getCurrentPosition();
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (locationError) {
          console.warn('Could not get user location, using default San Francisco location');
          location = DEFAULT_LOCATION;
        }
      }

      const result = await fetchFunction(location, ...args);
      setData(result);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      
      // Use mock data if available
      if (getMockData) {
        setData(getMockData());
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, useLocation, getMockData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData
  };
};

export default useFetch; 