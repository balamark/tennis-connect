import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
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

// Helper function to render Login with Router
const renderLogin = (setIsAuthenticated = jest.fn(), updateUserInfo = jest.fn()) => {
  return render(
    <BrowserRouter>
      <Login setIsAuthenticated={setIsAuthenticated} updateUserInfo={updateUserInfo} />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form correctly', () => {
    renderLogin();
    
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  test('updates form data when user types', () => {
    renderLogin();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('shows loading state during form submission', async () => {
    mockedApi.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderLogin();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('successful login stores token and redirects', async () => {
    const mockSetIsAuthenticated = jest.fn();
    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User'
        }
      }
    };
    
    mockedApi.post.mockResolvedValue(mockResponse);
    
    renderLogin(mockSetIsAuthenticated);
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/users/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.data.user));
    expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('displays error message on login failure', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Invalid credentials'
        }
      }
    };
    
    mockedApi.post.mockRejectedValue(mockError);
    
    renderLogin();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    
    expect(localStorage.getItem('token')).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('displays generic error message when no specific error is provided', async () => {
    const mockError = new Error('Network error');
    mockedApi.post.mockRejectedValue(mockError);
    
    renderLogin();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to login. Please try again.')).toBeInTheDocument();
    });
  });

  test('navigates to register page when register link is clicked', () => {
    renderLogin();
    
    const registerLink = screen.getByText('Register');
    fireEvent.click(registerLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  test('form validation requires email and password', () => {
    renderLogin();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('clears error message when form is resubmitted', async () => {
    // First, cause an error
    const mockError = {
      response: {
        data: {
          error: 'Invalid credentials'
        }
      }
    };
    mockedApi.post.mockRejectedValueOnce(mockError);
    
    renderLogin();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    
    // Now submit again with success
    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        user: { id: '123', email: 'test@example.com', name: 'Test User' }
      }
    };
    mockedApi.post.mockResolvedValue(mockResponse);
    
    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
    fireEvent.click(submitButton);
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });
}); 