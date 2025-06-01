import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Notifications from './Notifications';
import { useNotifications } from '../contexts/NotificationContext';

const Header = ({ isAuthenticated, userName, onLogout }) => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNotificationToggle = () => {
    setShowNotifications(!showNotifications);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7edf4] px-10 py-3">
      <div className="flex items-center gap-4 text-[#0d141c]">
        <div className="size-4">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em]">MatchPoint</h2>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="flex items-center gap-9">
          <Link 
            className={`text-sm font-medium leading-normal ${isActive('/') ? 'text-[#0c7ff2]' : 'text-[#0d141c]'}`} 
            to="/"
          >
            Home
          </Link>
          <Link 
            className={`text-sm font-medium leading-normal ${isActive('/find-partner') ? 'text-[#0c7ff2]' : 'text-[#0d141c]'}`} 
            to="/find-partner"
          >
            Find a partner
          </Link>
          <Link 
            className={`text-sm font-medium leading-normal ${isActive('/book-court') ? 'text-[#0c7ff2]' : 'text-[#0d141c]'}`} 
            to="/book-court"
          >
            Book a court
          </Link>
          <Link 
            className={`text-sm font-medium leading-normal ${isActive('/my-sessions') ? 'text-[#0c7ff2]' : 'text-[#0d141c]'}`} 
            to="/my-sessions"
          >
            My sessions
          </Link>
          <Link 
            className={`text-sm font-medium leading-normal ${isActive('/profile') ? 'text-[#0c7ff2]' : 'text-[#0d141c]'}`} 
            to="/profile"
          >
            Profile
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={handleNotificationToggle}
                  className="text-[#0d141c] hover:text-[#0c7ff2] transition-colors relative p-2"
                  data-icon="Bell" 
                  data-size="20px" 
                  data-weight="regular"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z" />
                  </svg>
                  {/* Notification Badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#0c7ff2] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                <Notifications 
                  isOpen={showNotifications}
                  onClose={handleCloseNotifications}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBe0x0bIDsboTowsCJq8QsQT2EF4kzjth79YnDXaQtYXY5J7p2bkiJ14j6NG699mVdz9BDOKTO3S4gpkbQaKfuyueFUlxGhBe-8Xo34OPqqn0OutpsGtLTFNZorjEwsqjZaVMihBsDPYz-wN-PDhVGJ-Mt5MGYZWriqvfi5wHCL-FCTFFA-D2oAzkOtotBu5Je_COymx6U6lbiHmblZ8H9OsuW8h83--qbFv8NJF6CDvtqdtNRCPyeLf0Slp1HoOnL8XQEdrfMW-7Y")`
                  }}
                />
                <button 
                  onClick={onLogout}
                  className="text-sm font-medium text-[#0d141c] hover:text-[#0c7ff2]"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="text-sm font-medium text-[#0d141c] hover:text-[#0c7ff2]"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0c7ff2] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em]"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 