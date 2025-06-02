import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import PlayBulletin from '../PlayBulletin';
import api from '../../api/config';

// Mock the API
jest.mock('../../api/config');
const mockedApi = api;

// Mock console
let consoleErrorSpy;

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
};
global.navigator.geolocation = mockGeolocation;

describe('PlayBulletin Component', () => {
  const mockBulletins = [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      title: 'Looking for singles partner',
      description: 'Need someone for practice',
      location: {
        zipCode: '94117',
        city: 'San Francisco',
        state: 'CA',
      },
      courtName: 'Golden Gate Park',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 5400000).toISOString(),
      skillLevel: '4.0',
      gameType: 'Singles',
      responses: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith',
      title: 'Doubles tournament prep',
      description: 'Looking for doubles partner',
      location: {
        zipCode: '94158',
        city: 'San Francisco',
        state: 'CA',
      },
      courtName: 'Riverside Tennis Club',
      startTime: new Date(Date.now() + 7200000).toISOString(),
      endTime: new Date(Date.now() + 9000000).toISOString(),
      skillLevel: '4.5',
      gameType: 'Doubles',
      responses: [
        {
          id: 'resp1',
          userId: 'user3',
          userName: 'Bob Wilson',
          message: 'I\'m interested!',
          status: 'Pending',
          createdAt: new Date().toISOString(),
        }
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      })
    );
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Loading and Data Fetching', () => {
    test('displays loading state initially', async () => {
      mockedApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<PlayBulletin />);
      
      expect(screen.getByText('Loading bulletins...')).toBeInTheDocument();
    });

    test('fetches and displays bulletins successfully', async () => {
      mockedApi.get.mockResolvedValue({
        data: { bulletins: mockBulletins }
      });

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Looking for singles partner')).toBeInTheDocument();
        expect(screen.getByText('Doubles tournament prep')).toBeInTheDocument();
      });

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/bulletins')
      );
    });

    test('shows mock data when API fails', async () => {
      mockedApi.get.mockRejectedValue(new Error('API Error'));
      
      render(<PlayBulletin />);

      await waitFor(() => {
        // When API fails, the banner title is "Demo Mode" and shows a specific message
        expect(screen.getByText('Demo Mode')).toBeInTheDocument();
        expect(screen.getByText('Unable to connect to server. Showing sample bulletins to demonstrate the feature.')).toBeInTheDocument();
        expect(consoleErrorSpy).toHaveBeenCalled(); 
        expect(screen.getByText('Looking for a partner for a friendly match')).toBeInTheDocument();
        // The raw error message ("Failed to load bulletins...") is not directly displayed if mock data is shown due to the error.
        // The 'error' state IS set, but the banner customizes the message.
      });
    });

    test('uses geolocation in API request', async () => {
      mockedApi.get.mockResolvedValue({
        data: { bulletins: [] }
      });

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith(
          expect.stringContaining('latitude=37.7749&longitude=-122.4194')
        );
      });
    });

    test('falls back to default location when geolocation fails', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) =>
        error(new Error('Geolocation error'))
      );
      
      mockedApi.get.mockResolvedValue({
        data: { bulletins: [] }
      });

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith(
          expect.stringContaining('latitude=37.7749&longitude=-122.4194')
        );
      });
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      mockedApi.get.mockResolvedValue({
        data: { bulletins: mockBulletins }
      });
    });

    test('applies skill level filter', async () => {
      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('')).toBeInTheDocument();
      });

      const skillFilter = screen.getByLabelText('Filter by Skill Level');
      const applyButton = screen.getByText('Apply Filters');

      await userEvent.selectOptions(skillFilter, '4.0');
      await userEvent.click(applyButton);

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('skill_level=4.0')
      );
    });

    test('applies game type filter', async () => {
      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('')).toBeInTheDocument();
      });

      const gameTypeFilter = screen.getByLabelText('Filter by Game Type');
      const applyButton = screen.getByText('Apply Filters');

      await userEvent.selectOptions(gameTypeFilter, 'Singles');
      await userEvent.click(applyButton);

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining('game_type=Singles')
      );
    });

    test('applies date filter', async () => {
      render(<PlayBulletin />);

      await waitFor(() => {
        // Ensure the component has rendered before trying to interact with filters
        expect(screen.getByLabelText('Filter by Available After')).toBeInTheDocument();
      });

      const dateFilter = screen.getByLabelText('Filter by Available After');
      const applyButton = screen.getByText('Apply Filters');
      const testDate = '2024-12-01T10:00';
      const isoDateString = new Date(testDate).toISOString();

      // Use fireEvent.change for datetime-local input
      fireEvent.change(dateFilter, { target: { value: testDate } });
      
      await userEvent.click(applyButton);

      expect(mockedApi.get).toHaveBeenCalledWith(
        expect.stringContaining(`start_after=${encodeURIComponent(isoDateString)}`)
      );
    });
  });

  describe('Create Bulletin', () => {
    beforeEach(async () => {
      mockedApi.get.mockResolvedValue({
        data: { bulletins: mockBulletins }
      });
      mockedApi.post.mockResolvedValue({
        data: { id: 'new-bulletin' }
      });
    });

    test('shows create form when button clicked', async () => {
      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Post a New Request')).toBeInTheDocument();
      });

      const postButton = screen.getByText('Post a New Request');
      await userEvent.click(postButton);

      expect(screen.getByText('Post a New Bulletin')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    test('creates bulletin successfully', async () => {
      window.alert = jest.fn(); // Mock window.alert

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Post a New Request')).toBeInTheDocument();
      });

      // Open form
      const postButton = screen.getByText('Post a New Request');
      await userEvent.click(postButton);

      // Fill form
      await userEvent.type(screen.getByLabelText('Title'), 'Test Bulletin');
      await userEvent.type(screen.getByLabelText('Description'), 'Test Description');
      await userEvent.type(screen.getByLabelText('Zip Code'), '94117');
      await userEvent.type(screen.getByLabelText('City'), 'San Francisco');
      await userEvent.type(screen.getByLabelText('State'), 'CA');
      
      // Use fireEvent.change for datetime-local inputs
      fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '2024-12-01T10:00' } });
      fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '2024-12-01T12:00' } });
      
      await userEvent.selectOptions(screen.getByLabelText('Skill Level'), '4.0');
      // Ensure gameType is also selected if it's a required field or part of the submitted data
      await userEvent.selectOptions(screen.getByLabelText('Game Type'), 'Singles'); 

      // Submit form
      const submitButton = screen.getByText('Post Bulletin');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith(
          '/bulletins',
          expect.objectContaining({
            title: 'Test Bulletin',
            description: 'Test Description',
            location: expect.objectContaining({
              zipCode: '94117',
              city: 'San Francisco',
              state: 'CA',
            }),
            startTime: new Date('2024-12-01T10:00').toISOString(), 
            endTime: new Date('2024-12-01T12:00').toISOString(),
            skillLevel: '4.0',
            gameType: 'Singles' // Match the selected game type
          })
        );
      });
      
      // Optionally, wait for the alert that confirms success if that's part of the flow
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Your bulletin has been posted!');
      });
    });

    test('handles create bulletin error', async () => {
      mockedApi.post.mockRejectedValue(new Error('Create failed'));
      
      // Mock window.alert
      window.alert = jest.fn();

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Post a New Request')).toBeInTheDocument();
      });

      // Open form and fill required fields
      const postButton = screen.getByText('Post a New Request');
      await userEvent.click(postButton);

      await userEvent.type(screen.getByLabelText('Title'), 'Test');
      await userEvent.type(screen.getByLabelText('Description'), 'Test');
      await userEvent.type(screen.getByLabelText('Zip Code'), '94117');
      await userEvent.type(screen.getByLabelText('City'), 'SF');
      await userEvent.type(screen.getByLabelText('State'), 'CA');
      await userEvent.type(screen.getByLabelText('Start Time'), '2024-12-01T10:00');
      await userEvent.type(screen.getByLabelText('End Time'), '2024-12-01T12:00');
      await userEvent.selectOptions(screen.getByLabelText('Skill Level'), '4.0');

      const submitButton = screen.getByText('Post Bulletin');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to create bulletin. Please try again.');
      });
    });
  });

  describe('Respond to Bulletins', () => {
    beforeEach(async () => {
      mockedApi.get.mockResolvedValue({
        data: { bulletins: mockBulletins }
      });
      mockedApi.post.mockResolvedValue({
        data: { id: 'response-id' }
      });
    });

    test('shows response form when respond button clicked', async () => {
      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Looking for singles partner')).toBeInTheDocument();
      });

      const respondButtons = screen.getAllByText('Respond');
      await userEvent.click(respondButtons[0]);

      expect(screen.getByPlaceholderText('Write your response...')).toBeInTheDocument();
      expect(screen.getByText('Send')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('sends response successfully', async () => {
      window.alert = jest.fn();

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Looking for singles partner')).toBeInTheDocument();
      });

      const respondButtons = screen.getAllByText('Respond');
      await userEvent.click(respondButtons[0]);

      const messageInput = screen.getByPlaceholderText('Write your response...');
      await userEvent.type(messageInput, 'I\'m interested!');

      const sendButton = screen.getByText('Send');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith(
          '/bulletins/1/respond',
          { message: 'I\'m interested!' }
        );
        expect(window.alert).toHaveBeenCalledWith('Your response has been sent!');
      });
    });

    test('cancels response form', async () => {
      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Looking for singles partner')).toBeInTheDocument();
      });

      const respondButtons = screen.getAllByText('Respond');
      await userEvent.click(respondButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText('Write your response...')).not.toBeInTheDocument();
    });
  });

  describe('Manage Responses', () => {
    test('shows responses for user bulletins', async () => {
      // Modify mockBulletins for this specific test
      const localMockBulletins = JSON.parse(JSON.stringify(mockBulletins)); // Deep clone
      localMockBulletins[0].responses = [ // Add a response to the first bulletin (owned by user1)
        {
          id: 'resp1-user1',
          userId: 'user-responder',
          userName: 'Test Responder',
          message: 'I am interested in user1 bulletin!',
          status: 'Pending',
          createdAt: new Date().toISOString(),
        }
      ];
      
      localStorage.setItem('user', JSON.stringify({ id: 'user1', name: 'Test User' }));

      mockedApi.get.mockResolvedValue({
        data: { bulletins: localMockBulletins }
      });

      render(<PlayBulletin />);

      await waitFor(() => {
        // Check for the response section for the first bulletin
        // The text might be specific to the bulletin's content or response count
        // For example, if the bulletin title is "Looking for singles partner"
        // and it now has one response.
        expect(screen.getByText('Responses (1)')).toBeInTheDocument();
        expect(screen.getByText('Test Responder')).toBeInTheDocument();
        expect(screen.getByText('I am interested in user1 bulletin!')).toBeInTheDocument();
      });
    });

    test('shows accept/decline buttons for pending responses', async () => {
      // Set up localStorage with a user that matches the second bulletin's userId
      localStorage.setItem('user', JSON.stringify({ id: 'user2', name: 'Test User' }));
      window.alert = jest.fn();

      mockedApi.get.mockResolvedValue({
        data: { bulletins: mockBulletins }
      });

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Accept')).toBeInTheDocument();
        expect(screen.getByText('Decline')).toBeInTheDocument();
      });

      const acceptButton = screen.getByText('Accept');
      await userEvent.click(acceptButton);

      expect(window.alert).toHaveBeenCalledWith('Accept/Decline functionality coming soon!');
    });
  });

  describe('Delete Bulletin', () => {
    beforeEach(async () => {
      // Set up localStorage with a user that matches the mock bulletins' userIds
      localStorage.setItem('user', JSON.stringify({ id: 'user1', name: 'Test User' }));
      mockedApi.get.mockResolvedValue({
        data: { bulletins: mockBulletins }
      });
      mockedApi.delete.mockResolvedValue({
        data: { message: 'Deleted successfully' }
      });
    });

    test('shows delete button for user bulletins', async () => {
      render(<PlayBulletin />);

      await waitFor(() => {
        // Only bulletins with userId 'user1' should show delete button
        expect(screen.getAllByText('Delete Bulletin')).toHaveLength(1);
      });
    });

    test('deletes bulletin successfully', async () => {
      window.confirm = jest.fn(() => true);
      window.alert = jest.fn();

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getAllByText('Delete Bulletin')).toHaveLength(1);
      });

      const deleteButtons = screen.getAllByText('Delete Bulletin');
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this bulletin?');
        expect(mockedApi.delete).toHaveBeenCalledWith('/bulletins/1');
        expect(window.alert).toHaveBeenCalledWith('Bulletin deleted successfully!');
      });
    });

    test('cancels deletion', async () => {
      window.confirm = jest.fn(() => false);

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getAllByText('Delete Bulletin')).toHaveLength(1);
      });

      const deleteButtons = screen.getAllByText('Delete Bulletin');
      await userEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockedApi.delete).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API fails', async () => {
      // This test is now largely identical to 'shows mock data when API fails' 
      // because the component's behavior for any fetch error is to show mock data + a specific banner.
      const specificErrorMessage = 'Custom Network Error Occurred';
      mockedApi.get.mockRejectedValue(new Error(specificErrorMessage));

      render(<PlayBulletin />);

      await waitFor(() => {
        // The banner title will be "Demo Mode" because showingMockData becomes true from the error
        expect(screen.getByText('Demo Mode')).toBeInTheDocument();
        // The specific message for API error + mock data should be shown
        expect(screen.getByText('Unable to connect to server. Showing sample bulletins to demonstrate the feature.')).toBeInTheDocument();
        // Check that console.error was called (as it's part of the catch block)
        expect(consoleErrorSpy).toHaveBeenCalled();
        // And mock data should be loaded
        expect(screen.getByText('Looking for a partner for a friendly match')).toBeInTheDocument();
        // The raw specificErrorMessage is used to set the 'error' state, 
        // but the UI shows the generic "Unable to connect..." when mock data is also shown.
      });
    });

    test('shows mock data when API fails', async () => {
      mockedApi.get.mockRejectedValue(new Error('API Error'));
      
      render(<PlayBulletin />);

      await waitFor(() => {
        // When API fails, the banner title is "Demo Mode" and shows a specific message
        expect(screen.getByText('Demo Mode')).toBeInTheDocument();
        expect(screen.getByText('Unable to connect to server. Showing sample bulletins to demonstrate the feature.')).toBeInTheDocument();
        expect(consoleErrorSpy).toHaveBeenCalled(); 
        expect(screen.getByText('Looking for a partner for a friendly match')).toBeInTheDocument();
        // The raw error message ("Failed to load bulletins...") is not directly displayed if mock data is shown due to the error.
        // The 'error' state IS set, but the banner customizes the message.
      });
    });

    test('handles response API failure', async () => {
      mockedApi.get.mockResolvedValue({
        data: { bulletins: mockBulletins }
      });
      mockedApi.post.mockRejectedValue(new Error('Response failed'));
      window.alert = jest.fn();

      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Looking for singles partner')).toBeInTheDocument();
      });

      const respondButtons = screen.getAllByText('Respond');
      await userEvent.click(respondButtons[0]);

      const messageInput = screen.getByPlaceholderText('Write your response...');
      await userEvent.type(messageInput, 'Test message');

      const sendButton = screen.getByText('Send');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to respond. Please try again.');
      });
    });
  });

  describe('UI Elements', () => {
    beforeEach(async () => {
      // Reset to default mock for UI element tests not focused on API errors
      mockedApi.get.mockResolvedValue({
        data: { bulletins: mockBulletins }
      });
    });

    test('displays page title and description', async () => {
      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Play Bulletin Board')).toBeInTheDocument();
        expect(screen.getByText(/Find a match partner or respond to requests/)).toBeInTheDocument();
      });
    });

    test('displays bulletin information correctly', async () => {
      render(<PlayBulletin />);

      await waitFor(() => {
        expect(screen.getByText('Looking for singles partner')).toBeInTheDocument();
        expect(screen.getByText('Posted by John Doe')).toBeInTheDocument();
        expect(screen.getByText(/Golden Gate Park/)).toBeInTheDocument();
        expect(screen.getByText(/Skill Level: 4.0/)).toBeInTheDocument();
      });
    });

    test('shows no bulletins message when empty', async () => {
      mockedApi.get.mockResolvedValue({
        data: { bulletins: [] } // API returns no actual bulletins
      });

      render(<PlayBulletin />);

      // According to component logic, if API returns empty, it WILL show mock data.
      // So, we expect to see the "Demo Mode" banner and mock bulletin content.
      await waitFor(() => {
        // Check for the "Demo Mode" banner
        expect(screen.getByText('Demo Mode')).toBeInTheDocument();
        // Check for the specific message within the demo banner for empty data
        expect(screen.getByText('No bulletins found in your area. Showing sample bulletins to demonstrate the feature.')).toBeInTheDocument();
        // Check that one of the mock bulletin titles is displayed (taken from getMockBulletins in PlayBulletin.js)
        expect(screen.getByText('Looking for a partner for a friendly match')).toBeInTheDocument(); 
      });

      // The original expectation is now incorrect based on the implemented logic
      // expect(screen.getByText('No bulletins found matching your criteria. Create one to get started!')).toBeInTheDocument();
    });
  });
}); 