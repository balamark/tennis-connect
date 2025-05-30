import React, { useState } from 'react';

const Calendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isSelectedDate = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date) => {
    if (date && !isPastDate(date)) {
      onDateSelect(date);
    }
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="flex min-w-72 max-w-[336px] flex-1 flex-col gap-0.5">
      {/* Month Navigation */}
      <div className="flex items-center p-1 justify-between">
        <button onClick={() => navigateMonth(-1)}>
          <div className="text-[#0d141c] flex size-10 items-center justify-center" data-icon="CaretLeft" data-size="18px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
            </svg>
          </div>
        </button>
        <p className="text-[#0d141c] text-base font-bold leading-tight flex-1 text-center">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </p>
        <button onClick={() => navigateMonth(1)}>
          <div className="text-[#0d141c] flex size-10 items-center justify-center" data-icon="CaretRight" data-size="18px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
            </svg>
          </div>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Day Headers */}
        {daysOfWeek.map((day, index) => (
          <p key={index} className="text-[#0d141c] text-[13px] font-bold leading-normal tracking-[0.015em] flex h-12 w-full items-center justify-center pb-0.5">
            {day}
          </p>
        ))}

        {/* Calendar Days */}
        {days.map((date, index) => (
          <button
            key={index}
            className={`h-12 w-full text-sm font-medium leading-normal ${
              !date 
                ? 'invisible' 
                : isPastDate(date)
                ? 'text-gray-300 cursor-not-allowed'
                : isSelectedDate(date)
                ? 'text-slate-50'
                : 'text-[#0d141c] hover:bg-gray-100'
            }`}
            onClick={() => handleDateClick(date)}
            disabled={!date || isPastDate(date)}
          >
            <div className={`flex size-full items-center justify-center rounded-full ${
              isSelectedDate(date) 
                ? 'bg-[#0c7ff2]' 
                : isToday(date) && !isSelectedDate(date)
                ? 'bg-gray-200'
                : ''
            }`}>
              {date ? date.getDate() : ''}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calendar; 