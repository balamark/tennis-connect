import { renderHook, waitFor } from '@testing-library/react';
import useFetch from '../useFetch';
import api from '../../api/config';

// Mock the API
jest.mock('../../api/config');
const mockedApi = api;

describe('useFetch Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns initial state correctly', () => {
    const { result } = renderHook(() => useFetch('/test-endpoint'));
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isDemoMode).toBe(false);
    expect(typeof result.current.toggleDemoMode).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });

  test('fetches data successfully', async () => {
    const mockData = { users: [{ id: 1, name: 'John' }] };
    mockedApi.get.mockResolvedValue({ data: mockData });
    
    const { result } = renderHook(() => useFetch('/users'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockedApi.get).toHaveBeenCalledWith('/users', { params: {} });
  });

  test('handles API error correctly', async () => {
    const mockError = new Error('Network error');
    mockedApi.get.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useFetch('/users'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Failed to fetch data');
  });

  test('passes query parameters correctly', async () => {
    const mockData = { users: [] };
    mockedApi.get.mockResolvedValue({ data: mockData });
    
    const queryParams = { skill_level: '4.0', radius: '10' };
    const { result } = renderHook(() => useFetch('/users', queryParams));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockedApi.get).toHaveBeenCalledWith('/users', { params: queryParams });
  });

  test('toggles demo mode correctly', async () => {
    const mockData = { users: [] };
    mockedApi.get.mockResolvedValue({ data: mockData });
    
    const { result } = renderHook(() => useFetch('/users'));
    
    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isDemoMode).toBe(false);
    
    // Toggle to demo mode
    result.current.toggleDemoMode();
    
    await waitFor(() => {
      expect(result.current.isDemoMode).toBe(true);
    });
    
    // Toggle back to live mode
    result.current.toggleDemoMode();
    
    await waitFor(() => {
      expect(result.current.isDemoMode).toBe(false);
    });
  });

  test('returns demo data when in demo mode', async () => {
    const { result } = renderHook(() => useFetch('/users'));
    
    // Toggle to demo mode
    result.current.toggleDemoMode();
    
    await waitFor(() => {
      expect(result.current.isDemoMode).toBe(true);
    });
    
    expect(result.current.data).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    
    // Should not call API in demo mode
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  test('refetch function works correctly', async () => {
    const mockData = { users: [{ id: 1, name: 'John' }] };
    mockedApi.get.mockResolvedValue({ data: mockData });
    
    const { result } = renderHook(() => useFetch('/users'));
    
    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    
    // Call refetch
    result.current.refetch();
    
    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledTimes(2);
    });
  });

  test('handles different endpoints correctly', async () => {
    const mockCourtData = { courts: [{ id: 1, name: 'Court 1' }] };
    mockedApi.get.mockResolvedValue({ data: mockCourtData });
    
    const { result } = renderHook(() => useFetch('/courts'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockCourtData);
    expect(mockedApi.get).toHaveBeenCalledWith('/courts', { params: {} });
  });

  test('handles empty response correctly', async () => {
    mockedApi.get.mockResolvedValue({ data: null });
    
    const { result } = renderHook(() => useFetch('/users'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('loading state is correct during fetch', () => {
    mockedApi.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const { result } = renderHook(() => useFetch('/users'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('demo mode persists across refetches', async () => {
    const { result } = renderHook(() => useFetch('/users'));
    
    // Toggle to demo mode
    result.current.toggleDemoMode();
    
    await waitFor(() => {
      expect(result.current.isDemoMode).toBe(true);
    });
    
    // Refetch should still be in demo mode
    result.current.refetch();
    
    await waitFor(() => {
      expect(result.current.isDemoMode).toBe(true);
    });
    
    // Should not call API
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  test('handles API response with error status', async () => {
    const mockError = {
      response: {
        status: 500,
        data: { error: 'Internal server error' }
      }
    };
    mockedApi.get.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useFetch('/users'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Failed to fetch data');
  });
}); 