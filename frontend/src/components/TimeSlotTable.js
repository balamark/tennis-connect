import React, { useState, useEffect } from 'react';

const TimeSlotTable = ({ courts, selectedCourt, selectedDate, selectedTimeSlot, availability, onTimeSlotSelect }) => {
  const [timeSlots, setTimeSlots] = useState([]);

  // Generate time slots from 8 AM to 8 PM
  useEffect(() => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      const time12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayTime = `${time12}:00 ${ampm}`;
      
      slots.push({
        id: hour,
        time: displayTime,
        hour: hour
      });
    }
    setTimeSlots(slots);
  }, []);

  // Get availability for a specific court and time slot
  const getAvailability = (courtId, timeSlot) => {
    // Check if we have real availability data
    const availabilityKey = `${courtId}-${selectedDate?.toDateString()}`;
    const courtAvailability = availability[availabilityKey];
    
    if (courtAvailability && Array.isArray(courtAvailability)) {
      // Find the specific time slot in the availability data
      const slotData = courtAvailability.find(slot => {
        const slotHour = new Date(slot.start_time).getHours();
        return slotHour === timeSlot.hour;
      });
      
      if (slotData) {
        return slotData.is_available ? 'Available' : 'Unavailable';
      }
    }
    
    // Fallback to mock logic if no real data
    // Court 2 is always unavailable for demo
    if (courtId === 2) {
      return 'Unavailable';
    }
    
    // Random unavailable slots for demo
    const unavailableSlots = [9, 11, 14, 16]; // 9 AM, 11 AM, 2 PM, 4 PM
    if (unavailableSlots.includes(timeSlot.hour)) {
      return 'Unavailable';
    }
    
    return 'Available';
  };

  const handleSlotClick = (court, timeSlot) => {
    const slotAvailability = getAvailability(court.id, timeSlot);
    if (slotAvailability === 'Available') {
      onTimeSlotSelect({
        court: court,
        timeSlot: timeSlot,
        time: timeSlot.time
      });
    }
  };

  const isSelected = (court, timeSlot) => {
    return selectedTimeSlot && 
           selectedTimeSlot.court.id === court.id && 
           selectedTimeSlot.timeSlot.id === timeSlot.id;
  };

  return (
    <div className="px-4 py-3">
      <div className="flex overflow-hidden rounded-lg border border-[#cedbe8] bg-slate-50">
        <table className="flex-1">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-[#0d141c] w-[216px] text-sm font-medium leading-normal">
                Time
              </th>
              {courts.map((court) => (
                <th key={court.id} className="px-4 py-3 text-left text-[#0d141c] w-[175px] text-sm font-medium leading-normal">
                  {court.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot) => (
              <tr key={timeSlot.id} className="border-t border-t-[#cedbe8]">
                <td className="h-[72px] px-4 py-2 w-[216px] text-[#0d141c] text-sm font-normal leading-normal flex items-center">
                  {timeSlot.time}
                </td>
                {courts.map((court) => {
                  const slotAvailability = getAvailability(court.id, timeSlot);
                  const isAvailable = slotAvailability === 'Available';
                  const selected = isSelected(court, timeSlot);
                  
                  return (
                    <td key={court.id} className="h-[72px] px-4 py-2 w-[175px] text-sm font-normal leading-normal">
                      <button
                        className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 text-sm font-medium leading-normal w-full transition-all ${
                          selected
                            ? 'bg-[#0c7ff2] text-slate-50'
                            : isAvailable
                            ? 'bg-[#e7edf4] text-[#0d141c] hover:bg-[#d1d9e0]'
                            : 'bg-red-100 text-red-600 cursor-not-allowed'
                        }`}
                        onClick={() => handleSlotClick(court, timeSlot)}
                        disabled={!isAvailable}
                      >
                        <span className="truncate">
                          {selected ? 'Selected' : slotAvailability}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeSlotTable; 