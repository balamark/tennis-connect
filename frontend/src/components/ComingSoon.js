import React from 'react';

const ComingSoon = ({ 
  title = "Coming Soon", 
  message = "This feature is currently under development and will be available soon!", 
  icon = "🚧",
  showBackButton = true,
  onBack = () => window.history.back()
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Icon */}
          <div className="text-6xl mb-6">
            {icon}
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {title}
          </h1>
          
          {/* Message */}
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            {message}
          </p>
          
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
              <span>Development Progress</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full w-3/4 animate-pulse"></div>
            </div>
          </div>
          
          {/* Features list */}
          <div className="text-left mb-8">
            <h3 className="font-semibold text-gray-700 mb-3">What's coming:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                User interface design
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">⏳</span>
                Backend integration
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">⏳</span>
                Advanced features
              </li>
              <li className="flex items-center">
                <span className="text-gray-400 mr-2">○</span>
                Testing & optimization
              </li>
            </ul>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showBackButton && (
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                ← Go Back
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 font-medium shadow-lg"
            >
              🏠 Return Home
            </button>
          </div>
          
          {/* Notification signup */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700 mb-3">
              <strong>Stay updated!</strong> We'll notify you when this feature is ready.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors">
                Notify Me
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon; 