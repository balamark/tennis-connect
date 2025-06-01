import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import api from '../../api/config';

// Mock the API
jest.mock('../../api/config');
const mockedApi = api;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window.alert
global.alert = jest.fn();

// Helper function to render Register with Router
const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

// Helper function to fill form with valid data
const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
  fireEvent.change(screen.getByLabelText('Skill Level (NTRP)'), { target: { value: '4.0' } });
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form correctly', () => {
    renderRegister();
    
    expect(screen.getByText('Create an Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Skill Level (NTRP)')).toBeInTheDocument();
    expect(screen.getByLabelText('Gender (for safety filters)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  test('updates form data when user types', () => {
    renderRegister();
    
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('handles game style selection', () => {
    renderRegister();
    
    const singlesCheckbox = screen.getByLabelText('Singles');
    const doublesCheckbox = screen.getByLabelText('Doubles');
    
    fireEvent.click(singlesCheckbox);
    fireEvent.click(doublesCheckbox);
    
    expect(singlesCheckbox).toBeChecked();
    expect(doublesCheckbox).toBeChecked();
    
    // Uncheck singles
    fireEvent.click(singlesCheckbox);
    expect(singlesCheckbox).not.toBeChecked();
    expect(doublesCheckbox).toBeChecked();
  });

  test('clears error when user starts typing', () => {
    renderRegister();
    
    // Trigger an error first
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Full name is required')).toBeInTheDocument();
    
    // Start typing in name field
    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'J' } });
    
    // Error should be cleared
    expect(screen.queryByText('Full name is required')).not.toBeInTheDocument();
  });

  describe('Form Validation', () => {
    test('shows error for empty name', async () => {
      renderRegister();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    test('shows error for empty email', async () => {
      renderRegister();
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    test('shows error for invalid email format', async () => {
      renderRegister();
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    test('shows error for short password', async () => {
      renderRegister();
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    test('shows password mismatch error', async () => {
      renderRegister();
      
      fillValidForm();
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'differentpassword' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    test('shows error for missing skill level', async () => {
      renderRegister();
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Please select your skill level')).toBeInTheDocument();
      expect(mockedApi.post).not.toHaveBeenCalled();
    });
  });

  describe('Successful Registration', () => {
    test('successful registration shows alert and navigates to login', async () => {
      mockedApi.post.mockResolvedValue({ 
        data: { 
          message: 'Account created successfully',
          user: { id: '123', name: 'John Doe', email: 'john@example.com' }
        } 
      });
      
      renderRegister();
      fillValidForm();
      
      // Select game styles
      fireEvent.click(screen.getByLabelText('Singles'));
      fireEvent.click(screen.getByLabelText('Competitive'));
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/users/register', {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          skillLevel: 4.0,
          gameStyles: ['Singles', 'Competitive'],
          gender: '',
          isNewToArea: false,
          location: {
            latitude: 37.7749,
            longitude: -122.4194,
            zipCode: '',
            city: '',
            state: ''
          }
        });
      });
      
      expect(global.alert).toHaveBeenCalledWith('Registration successful! Please sign in.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('form is cleared after successful registration', async () => {
      mockedApi.post.mockResolvedValue({ 
        data: { 
          message: 'Account created successfully',
          user: { id: '123', name: 'John Doe', email: 'john@example.com' }
        } 
      });
      
      renderRegister();
      fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
      
      // Check that form fields are cleared
      expect(screen.getByLabelText('Full Name').value).toBe('');
      expect(screen.getByLabelText('Email').value).toBe('');
      expect(screen.getByLabelText('Password').value).toBe('');
      expect(screen.getByLabelText('Confirm Password').value).toBe('');
    });
  });

  describe('Error Handling', () => {
    test('displays specific error message from server', async () => {
      const mockError = {
        response: {
          data: {
            error: 'An account with this email already exists'
          }
        }
      };
      
      mockedApi.post.mockRejectedValue(mockError);
      
      renderRegister();
      fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('An account with this email already exists')).toBeInTheDocument();
      });
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('displays appropriate error for 400 status', async () => {
      const mockError = {
        response: {
          status: 400
        }
      };
      
      mockedApi.post.mockRejectedValue(mockError);
      
      renderRegister();
      fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please check your information and try again.')).toBeInTheDocument();
      });
    });

    test('displays appropriate error for 409 status', async () => {
      const mockError = {
        response: {
          status: 409
        }
      };
      
      mockedApi.post.mockRejectedValue(mockError);
      
      renderRegister();
      fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument();
      });
    });

    test('displays appropriate error for 500+ status', async () => {
      const mockError = {
        response: {
          status: 500
        }
      };
      
      mockedApi.post.mockRejectedValue(mockError);
      
      renderRegister();
      fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
      });
    });

    test('displays network error message', async () => {
      const mockError = {
        code: 'NETWORK_ERROR'
      };
      
      mockedApi.post.mockRejectedValue(mockError);
      
      renderRegister();
      fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Unable to connect to server. Please check your internet connection.')).toBeInTheDocument();
      });
    });

    test('displays generic error message for unknown errors', async () => {
      const mockError = new Error('Unknown error');
      mockedApi.post.mockRejectedValue(mockError);
      
      renderRegister();
      fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to register. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('shows loading state during form submission', async () => {
      mockedApi.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderRegister();
      fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.queryByText('Creating Account...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to login page when login link is clicked', () => {
      renderRegister();
      
      const loginLink = screen.getByText('Sign In');
      fireEvent.click(loginLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Form Attributes', () => {
    test('form validation requires required fields', () => {
      renderRegister();
      
      const nameInput = screen.getByLabelText('Full Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      
      expect(nameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      expect(confirmPasswordInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('minLength', '6');
    });
  });

  describe('Data Handling', () => {
    test('includes newcomer status in registration data', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: '123' } });
      
      renderRegister();
      fillValidForm();
      
      // Check newcomer checkbox
      fireEvent.click(screen.getByLabelText("I'm new to the area and looking to meet players"));
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/users/register', expect.objectContaining({
          isNewToArea: true
        }));
      });
    });

    test('trims whitespace from name and email', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: '123' } });
      
      renderRegister();
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: '  John Doe  ' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  JOHN@EXAMPLE.COM  ' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Skill Level (NTRP)'), { target: { value: '4.0' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/users/register', expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com'
        }));
      });
    });
  });
}); 