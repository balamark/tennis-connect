import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Notifications from './Notifications';
import { useNotifications } from '../contexts/NotificationContext';

const Header = ({ isAuthenticated, userName, onLogout }) => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const navigationItems = [
    { path: '/', label: 'Home' },
    { path: '/find-partner', label: 'Find a partner' },
    { path: '/book-court', label: 'Book a court' },
    { path: '/my-sessions', label: 'My sessions' },
    { path: '/play-bulletin', label: 'Bulletins' },
    { path: '/communities', label: 'Communities' },
    { path: '/events', label: 'Events' },
  ];

  return (
    <header className="border-b border-solid border-b-[#e7edf4] bg-white sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">
        {/* Logo - Make clickable */}
        <Link 
          to="/" 
          className="flex items-center gap-2 sm:gap-4 text-[#0d141c] hover:text-[#0c7ff2] transition-colors"
          onClick={closeMobileMenu}
        >
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
          <h2 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] hidden sm:block">MatchPoint</h2>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          <nav className="flex items-center gap-4 xl:gap-6">
            {navigationItems.map(item => (
              <Link 
                key={item.path}
                className={`text-sm font-medium leading-normal whitespace-nowrap ${
                  isActive(item.path) ? 'text-[#0c7ff2]' : 'text-[#0d141c] hover:text-[#0c7ff2]'
                } transition-colors`} 
                to={item.path}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link 
                className={`text-sm font-medium leading-normal whitespace-nowrap ${
                  isActive('/profile') ? 'text-[#0c7ff2]' : 'text-[#0d141c] hover:text-[#0c7ff2]'
                } transition-colors`} 
                to="/profile"
              >
                {userName || 'Profile'}
              </Link>
            )}
          </nav>

          {/* Desktop Auth Section */}
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
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 lg:size-10"
                    style={{
                      backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBe0x0bIDsboTowsCJq8QsQT2EF4kzjth79YnDXaQtYXY5J7p2bkiJ14j6NG699mVdz9BDOKTO3S4gpkbQaKfuyueFUlxGhBe-8Xo34OPqqn0OutpsGtLTFNZorjEwsqjZaVMihBsDPYz-wN-PDhVGJ-Mt5MGYZWriqvfi5wHCL-FCTFFA-D2oAzkOtotBu5Je_COymx6U6lbiHmblZ8H9OsuW8h83--qbFv8NJF6CDvtqdtNRCPyeLf0Slp1HoOnL8XQEdrfMW-7Y")`
                    }}
                  />
                  <button 
                    onClick={onLogout}
                    className="text-sm font-medium text-[#0d141c] hover:text-[#0c7ff2] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-[#0d141c] hover:text-[#0c7ff2] transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0c7ff2] text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0a6fd1] transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button and Auth */}
        <div className="flex lg:hidden items-center gap-3">
          {isAuthenticated && (
            <>
              {/* Mobile Notification Bell */}
              <div className="relative">
                <button 
                  onClick={handleNotificationToggle}
                  className="text-[#0d141c] hover:text-[#0c7ff2] transition-colors relative p-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#0c7ff2] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <Notifications 
                  isOpen={showNotifications}
                  onClose={handleCloseNotifications}
                />
              </div>

              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8"
                style={{
                  backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBe0x0bIDsboTowsCJq8QsQT2EF4kzjth79YnDXaQtYXY5J7p2bkiJ14j6NG699mVdz9BDOKTO3S4gpkbQaKfuyueFUlxGhBe-8Xo34OPqqn0OutpsGtLTFNZorjEwsqjZaVMihBsDPYz-wN-PDhVGJ-Mt5MGYZWriqvfi5wHCL-FCTFFA-D2oAzkOtotBu5Je_COymx6U6lbiHmblZ8H9OsuW8h83--qbFv8NJF6CDvtqdtNRCPyeLf0Slp1HoOnL8XQEdrfMW-7Y")`
                }}
              />
            </>
          )}

          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-[#0d141c] hover:text-[#0c7ff2] transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              {showMobileMenu ? (
                <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"/>
              ) : (
                <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-[#e7edf4] bg-white">
          <nav className="px-4 py-4 space-y-3">
            {navigationItems.map(item => (
              <Link 
                key={item.path}
                className={`block text-base font-medium leading-normal ${
                  isActive(item.path) ? 'text-[#0c7ff2]' : 'text-[#0d141c]'
                } hover:text-[#0c7ff2] transition-colors py-2`} 
                to={item.path}
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link 
                  className={`block text-base font-medium leading-normal ${
                    isActive('/profile') ? 'text-[#0c7ff2]' : 'text-[#0d141c]'
                  } hover:text-[#0c7ff2] transition-colors py-2`} 
                  to="/profile"
                  onClick={closeMobileMenu}
                >
                  {userName || 'Profile'}
                </Link>
                <button 
                  onClick={() => {
                    onLogout();
                    closeMobileMenu();
                  }}
                  className="block text-base font-medium text-[#0d141c] hover:text-[#0c7ff2] transition-colors py-2 w-full text-left"
                >
                  Sign Out
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link 
                  to="/login" 
                  className="block text-base font-medium text-[#0d141c] hover:text-[#0c7ff2] transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="block w-full text-center mt-3 cursor-pointer overflow-hidden rounded-lg h-12 px-4 bg-[#0c7ff2] text-slate-50 text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#0a6fd1] transition-colors flex items-center justify-center"
                  onClick={closeMobileMenu}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header; 