import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import api from '../../api/config';

// Mock the API
jest.mock('../../api/config', () => ({
  post: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window.alert
global.alert = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Helper function to render Register with Router
const renderRegister = () => {
  return render(
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
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
    
    // Set up realistic localStorage mock that actually stores values
    const storage = {};
    localStorageMock.getItem.mockImplementation((key) => storage[key] || null);
    localStorageMock.setItem.mockImplementation((key, value) => {
      storage[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key) => {
      delete storage[key];
    });
    localStorageMock.clear.mockImplementation(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    });
    
    // Ensure API mock is properly reset
    api.post.mockClear();
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
      expect(api.post).not.toHaveBeenCalled();
    });

    test('shows error for empty email', async () => {
      renderRegister();
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    test('shows error for invalid email format', async () => {
      renderRegister();
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    test('shows error for short password', async () => {
      renderRegister();
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    test('shows password mismatch error', async () => {
      renderRegister();
      
      fillValidForm();
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'differentpassword' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
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
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  describe('Successful Registration', () => {
    // FEATURE GROUP 7: Registration Flow & API Integration
    // TODO: Fix API mocking and form submission
    /*
    test('successful registration shows alert and navigates to login', async () => {
      api.post.mockResolvedValue({ 
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
        expect(api.post).toHaveBeenCalledWith('/users/register', {
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
      api.post.mockResolvedValue({ 
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
    */
  });

  describe('Error Handling', () => {
    // FEATURE GROUP 8: Registration Error Handling
    // TODO: Fix error handling and API mock responses
    /*
    test('displays specific error message from server', async () => {
      const mockError = {
        response: {
          data: {
            error: 'An account with this email already exists'
          }
        }
      };
      
      api.post.mockRejectedValue(mockError);
      
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
      
      api.post.mockRejectedValue(mockError);
      
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
      
      api.post.mockRejectedValue(mockError);
      
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
      
      api.post.mockRejectedValue(mockError);
      
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
      
      api.post.mockRejectedValue(mockError);
      
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
      api.post.mockRejectedValue(mockError);
      
      renderRegister();
      fillValidForm();
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to register. Please try again.')).toBeInTheDocument();
      });
    });
    */
  });

  describe('Loading State', () => {
    // FEATURE GROUP 9: Registration Loading States
    // TODO: Fix loading state detection
    /*
    test('shows loading state during form submission', async () => {
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
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
    */
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
      api.post.mockResolvedValue({ data: { id: '123' } });
      
      renderRegister();
      fillValidForm();
      
      // Check newcomer checkbox
      fireEvent.click(screen.getByLabelText("I'm new to the area and looking to meet players"));
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/users/register', expect.objectContaining({
          isNewToArea: true
        }));
      });
    });

    test('trims whitespace from name and email', async () => {
      api.post.mockResolvedValue({ data: { id: '123' } });
      
      renderRegister();
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: '  John Doe  ' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  JOHN@EXAMPLE.COM  ' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Skill Level (NTRP)'), { target: { value: '4.0' } });
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/users/register', expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com'
        }));
      });
    });
  });

  describe('Game Style Checkboxes', () => {
    test('renders all game style options', () => {
      renderRegister();
      
      expect(screen.getByText('Singles')).toBeInTheDocument();
      expect(screen.getByText('Doubles')).toBeInTheDocument();
      expect(screen.getByText('Social')).toBeInTheDocument();
      expect(screen.getByText('Competitive')).toBeInTheDocument();
    });

         test('allows multiple game styles to be selected', () => {
       renderRegister();
       
       const singlesCheckbox = screen.getByRole('checkbox', { name: /singles/i });
       const doublesCheckbox = screen.getByRole('checkbox', { name: /doubles/i });
       
       expect(singlesCheckbox).not.toBeChecked();
       expect(doublesCheckbox).not.toBeChecked();
       
       fireEvent.click(singlesCheckbox);
       fireEvent.click(doublesCheckbox);
       
       expect(singlesCheckbox).toBeChecked();
       expect(doublesCheckbox).toBeChecked();
     });

         test('allows game styles to be unchecked', () => {
       renderRegister();
       
       const singlesCheckbox = screen.getByRole('checkbox', { name: /singles/i });
       
       // Check then uncheck
       fireEvent.click(singlesCheckbox);
       expect(singlesCheckbox).toBeChecked();
       
       fireEvent.click(singlesCheckbox);
       expect(singlesCheckbox).not.toBeChecked();
     });

         test('handles all four game style selections correctly', () => {
       renderRegister();
       
       const gameStyles = ['Singles', 'Doubles', 'Social', 'Competitive'];
       const checkboxes = gameStyles.map(style => 
         screen.getByRole('checkbox', { name: new RegExp(style, 'i') })
       );
       
       // Select all
       checkboxes.forEach(checkbox => fireEvent.click(checkbox));
       
       // Verify all are checked
       checkboxes.forEach(checkbox => expect(checkbox).toBeChecked());
       
       // Unselect one
       fireEvent.click(checkboxes[0]);
       expect(checkboxes[0]).not.toBeChecked();
       
       // Others should still be checked
       checkboxes.slice(1).forEach(checkbox => expect(checkbox).toBeChecked());
     });
  });

  describe('Gender Selection', () => {
         test('renders gender dropdown with all options', () => {
       renderRegister();
       
       const genderSelect = screen.getByLabelText(/gender/i);
       expect(genderSelect).toBeInTheDocument();
       
       // Check that all gender options exist
       const femaleOption = Array.from(genderSelect.options).find(option => option.value === 'Female');
       const maleOption = Array.from(genderSelect.options).find(option => option.value === 'Male');
       const otherOption = Array.from(genderSelect.options).find(option => option.value === 'Other');
       const preferNotToSayOption = Array.from(genderSelect.options).find(option => option.value === '');
       
       expect(femaleOption).toBeInTheDocument();
       expect(maleOption).toBeInTheDocument();
       expect(otherOption).toBeInTheDocument();
       expect(preferNotToSayOption).toBeInTheDocument();
     });

    test('allows gender selection', () => {
      renderRegister();
      
      const genderSelect = screen.getByLabelText(/gender/i);
      
      fireEvent.change(genderSelect, { target: { value: 'Female' } });
      expect(genderSelect.value).toBe('Female');
      
      fireEvent.change(genderSelect, { target: { value: 'Male' } });
      expect(genderSelect.value).toBe('Male');
    });

    test('defaults to empty string (prefer not to say)', () => {
      renderRegister();
      
      const genderSelect = screen.getByLabelText(/gender/i);
      expect(genderSelect.value).toBe('');
    });
  });

  describe('New to Area Checkbox', () => {
    test('renders new to area checkbox', () => {
      renderRegister();
      
      const newToAreaCheckbox = screen.getByRole('checkbox', { 
        name: /i'm new to the area and looking to meet players/i 
      });
      expect(newToAreaCheckbox).toBeInTheDocument();
      expect(newToAreaCheckbox).not.toBeChecked();
    });

    test('allows new to area checkbox to be checked and unchecked', () => {
      renderRegister();
      
      const newToAreaCheckbox = screen.getByRole('checkbox', { 
        name: /i'm new to the area and looking to meet players/i 
      });
      
      fireEvent.click(newToAreaCheckbox);
      expect(newToAreaCheckbox).toBeChecked();
      
      fireEvent.click(newToAreaCheckbox);
      expect(newToAreaCheckbox).not.toBeChecked();
    });
  });

  describe('Form Submission', () => {
    test('submits form with selected game styles and gender', async () => {
      api.post.mockResolvedValue({ data: { id: 1 } });
      renderRegister();
      
      fillValidForm();
      
             // Select game styles
       fireEvent.click(screen.getByRole('checkbox', { name: /singles/i }));
       fireEvent.click(screen.getByRole('checkbox', { name: /doubles/i }));
      
      // Select gender
      fireEvent.change(screen.getByLabelText(/gender/i), { 
        target: { value: 'Female' } 
      });
      
      // Check new to area
      fireEvent.click(screen.getByRole('checkbox', { 
        name: /i'm new to the area and looking to meet players/i 
      }));
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/users/register', expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          gameStyles: ['Singles', 'Doubles'],
          gender: 'Female',
          isNewToArea: true,
          skillLevel: 4.0
        }));
      });
    });

    test('submits form with empty game styles array when none selected', async () => {
      api.post.mockResolvedValue({ data: { id: 1 } });
      renderRegister();
      
      fillValidForm();
      
      // Don't select any game styles
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/users/register', expect.objectContaining({
          gameStyles: [],
          gender: '',
          isNewToArea: false
        }));
      });
    });
  });

  describe('Accessibility', () => {
         test('checkboxes have proper labels and are keyboard accessible', () => {
       renderRegister();
       
       const singlesCheckbox = screen.getByRole('checkbox', { name: /singles/i });
       
       expect(singlesCheckbox).toHaveAttribute('name', 'gameStyles');
       expect(singlesCheckbox).toHaveAttribute('value', 'Singles');
       
       // Test keyboard interaction
       singlesCheckbox.focus();
       fireEvent.keyPress(singlesCheckbox, { key: ' ', charCode: 32 });
       
       // Note: Some browsers may not trigger change on keypress, so we test focus
       expect(document.activeElement).toBe(singlesCheckbox);
     });

    test('gender select has proper label', () => {
      renderRegister();
      
      const genderSelect = screen.getByLabelText(/gender/i);
      expect(genderSelect).toHaveAccessibleName();
    });
  });
}); 