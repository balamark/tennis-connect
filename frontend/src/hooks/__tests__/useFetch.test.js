import { renderHook, waitFor } from '@testing-library/react';
import useFetch from '../useFetch';

// Mock the API
jest.mock('../../api/config', () => ({
  get: jest.fn()
}));

const mockedApi = require('../../api/config');

describe('useFetch Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('returns initial state correctly', () => {
    const mockFetchFunction = jest.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useFetch(mockFetchFunction, [], { autoFetch: false }));
    
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.setData).toBe('function');
  });

  test('fetches data successfully', async () => {
    const mockData = [{ id: 1, name: 'John' }];
    const mockFetchFunction = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
  });

  test('handles fetch errors', async () => {
    const mockFetchFunction = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe('Network error');
    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
  });

  test('refetch function works correctly', async () => {
    const mockData = [{ id: 1, name: 'John' }];
    const mockFetchFunction = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    
    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockFetchFunction).toHaveBeenCalledTimes(1);
    
    // Call refetch
    result.current.refetch();
    
    await waitFor(() => {
      expect(mockFetchFunction).toHaveBeenCalledTimes(2);
    });
  });

  test('handles location-based fetching', async () => {
    const mockData = [{ id: 1, name: 'John' }];
    const mockFetchFunction = jest.fn().mockResolvedValue(mockData);
    
    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194
          }
        });
      })
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    });
    
    const { result } = renderHook(() => useFetch(mockFetchFunction, [], { useLocation: true }));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockFetchFunction).toHaveBeenCalledWith({
      latitude: 37.7749,
      longitude: -122.4194
    });
  });

  test('falls back to default location when geolocation fails', async () => {
    const mockData = [{ id: 1, name: 'John' }];
    const mockFetchFunction = jest.fn().mockResolvedValue(mockData);
    
    // Mock geolocation failure
    const mockGeolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success, error) => {
        error(new Error('Location access denied'));
      })
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    });
    
    const { result } = renderHook(() => useFetch(mockFetchFunction, [], { useLocation: true }));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should use default San Francisco location
    expect(mockFetchFunction).toHaveBeenCalledWith({
      latitude: 37.7749,
      longitude: -122.4194
    });
  });

  test('setData function works correctly', async () => {
    const mockData = [{ id: 1, name: 'John' }];
    const mockFetchFunction = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useFetch(mockFetchFunction));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Update data manually using act to avoid warnings
    const newData = [{ id: 2, name: 'Jane' }];
    await waitFor(() => {
      result.current.setData(newData);
      expect(result.current.data).toEqual(newData);
    });
  });
}); 