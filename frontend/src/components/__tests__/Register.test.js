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

  test('handles skill level selection', () => {
    renderRegister();
    
    const skillLevelSelect = screen.getByLabelText('Skill Level (NTRP)');
    fireEvent.change(skillLevelSelect, { target: { value: '4.0' } });
    
    expect(skillLevelSelect.value).toBe('4.0');
  });

  test('handles gender selection', () => {
    renderRegister();
    
    const genderSelect = screen.getByLabelText('Gender (for safety filters)');
    fireEvent.change(genderSelect, { target: { value: 'Female' } });
    
    expect(genderSelect.value).toBe('Female');
  });

  test('handles newcomer checkbox', () => {
    renderRegister();
    
    const newcomerCheckbox = screen.getByLabelText("I'm new to the area and looking to meet players");
    fireEvent.click(newcomerCheckbox);
    
    expect(newcomerCheckbox).toBeChecked();
  });

  test('shows password mismatch error', async () => {
    renderRegister();
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    fireEvent.change(screen.getByLabelText('Skill Level (NTRP)'), { target: { value: '4.0' } });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  test('shows loading state during form submission', async () => {
    mockedApi.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderRegister();
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Skill Level (NTRP)'), { target: { value: '4.0' } });
    fireEvent.change(screen.getByLabelText('Gender (for safety filters)'), { target: { value: 'Male' } });
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('successful registration shows alert and navigates to login', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: '123' } });
    
    renderRegister();
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Skill Level (NTRP)'), { target: { value: '4.0' } });
    fireEvent.change(screen.getByLabelText('Gender (for safety filters)'), { target: { value: 'Male' } });
    
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
        gender: 'Male',
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

  test('displays error message on registration failure', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Email already exists'
        }
      }
    };
    
    mockedApi.post.mockRejectedValue(mockError);
    
    renderRegister();
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Skill Level (NTRP)'), { target: { value: '4.0' } });
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('displays generic error message when no specific error is provided', async () => {
    const mockError = new Error('Network error');
    mockedApi.post.mockRejectedValue(mockError);
    
    renderRegister();
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Skill Level (NTRP)'), { target: { value: '4.0' } });
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to register. Please try again.')).toBeInTheDocument();
    });
  });

  test('navigates to login page when login link is clicked', () => {
    renderRegister();
    
    const loginLink = screen.getByText('Sign In');
    fireEvent.click(loginLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

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

  test('includes newcomer status in registration data', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: '123' } });
    
    renderRegister();
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Skill Level (NTRP)'), { target: { value: '4.0' } });
    
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
}); 