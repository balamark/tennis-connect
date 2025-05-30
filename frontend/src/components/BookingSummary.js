import React from 'react';

const BookingSummary = ({ court, date, timeSlot, onBook, loading }) => {
  const formatDate = (date) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="p-4">
      <div className="flex items-stretch justify-between gap-4 rounded-lg">
        <div className="flex flex-col gap-1 flex-[2_2_0px]">
          <p className="text-[#49739c] text-sm font-normal leading-normal">
            {court.name}
          </p>
          <p className="text-[#0d141c] text-base font-bold leading-tight">
            {formatDate(date)}, {timeSlot.time}
          </p>
          <p className="text-[#49739c] text-sm font-normal leading-normal">
            1 hour
          </p>
        </div>
        <div
          className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg flex-1"
          style={{
            backgroundImage: `url("${court.image}")`
          }}
        />
      </div>
      
      <div className="flex px-0 py-3 justify-end">
        <button
          className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 text-base font-bold leading-normal tracking-[0.015em] transition-all ${
            loading 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-[#0c7ff2] text-slate-50 hover:bg-[#0a6fd1]'
          }`}
          onClick={onBook}
          disabled={loading}
        >
          <span className="truncate">
            {loading ? 'Booking...' : 'Register for session'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BookingSummary; 