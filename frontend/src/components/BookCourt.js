import React, { useState, useEffect } from 'react';
import Calendar from './Calendar';
import TimeSlotTable from './TimeSlotTable';
import BookingSummary from './BookingSummary';
import { bookingApi } from '../api/bookingApi';
import { useDemoMode } from '../contexts/DemoModeContext';
import { getMockCourts, getMockCourtAvailability } from '../data/mockData';

const BookCourt = () => {
  const { isDemoMode } = useDemoMode();
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [courtsLoading, setCourtsLoading] = useState(true);

  // Load courts from API or use mock data in demo mode
  useEffect(() => {
    const loadCourts = async () => {
      try {
        setCourtsLoading(true);
        
        // Use mock data in demo mode
        if (isDemoMode) {
          const mockCourts = getMockCourts();
          setCourts(mockCourts);
          setSelectedCourt(mockCourts[0]);
          setCourtsLoading(false);
          return;
        }
        const courtsData = await bookingApi.getCourts();
        
        // If API returns courts, use them; otherwise use mock data
        if (courtsData && courtsData.length > 0) {
          setCourts(courtsData);
          setSelectedCourt(courtsData[0]);
        } else {
          // Fallback to mock data if API is not available
          const mockCourts = [
            {
              id: 1,
              name: 'Court 1',
              status: 'Available',
              image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXYjLJrQr70WG7goVHLT85nNHnHdMWLZRTmuJmvQ1ST1zLhSKKyRlHQB-0PNsmll3SuhEPnlefEHv1tVx-PKwyjU_h3rhnQBSs7FLPAPgJhYEy7FEfWxJTcCtlH9JRX89v6ylKpeMntPbGZmDmEDQjTHcdhvjTa7oksahWrLxMDcDcocL476cXVXworxX0adfUoGpbhFFD5od9gp9WEbCZP7pJv-yYPagEeOm8xaf-UyeIMDRKr2t3T3UvzAC7Fsn9jjH-Ciyy0qo'
            },
            {
              id: 2,
              name: 'Court 2',
              status: 'Unavailable',
              image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBktmqVDxqx603z_WNXlBsK0FrOoU8bzGFuqhIyZysM0vALoMN72PoCOHwAM4ScFmNK-FALh6zrP_V5WZWkfN0PkPBN0ZT2vHCWrl05il5rJH93wHfhbayiRF3T68wd2sbm_RBHgi6R_fIw9SVGtCYoo3XT7jHaTne9YOjxZzTXH83e-swdMbSNLUA6HNiUoXhek7SJJSKSmhN-LoQ-7rv045C6l1h-kUmEPp82EnesaargwlZyMqrNOx7-foQmkYxEYeYzA6yU55s'
            },
            {
              id: 3,
              name: 'Court 3',
              status: 'Available',
              image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABOmZdppcuILP3-aSNCQVu5vEHIUEssoKJ03j_9q87tYyaydw6n5yfI4khq947TL2YCd6Ha67KN8dd5m7HzI2I_kkYW44rYW9iWTEJKjqNwSMkvnImlnk1X4XCV0N0zxAb5AYeLcDeAhrmQQcqrw-C_Bo0qRCDjSMOpetznM9lta0BLji5GHdq2SaDVmkMGiUaYN7OfYpNQbCrWxBtoQ9Gdiv4ICMPz_-OybuaXWO_DOmXEe_N0BwuD8fAfj0tOQOUevPmd2s9NSY'
            },
            {
              id: 4,
              name: 'Court 4',
              status: 'Available',
              image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxQ-a6sCKBrfZGl-OOXna_ubij7Vc5rI3T67zSntCTm7fw1UIqQSPwK-NKj6KuAM8ADL6gl3sw0cGoYUWuNVDaaEBuHxxiS5Uek_7BSbSTtUoxpJ-ewBfZYu1JslrP8HaMmV-Q4bY2UXUbXE8A89gsjTd2kbTY9LaZrPq-pi-CeTXGWyxLNdx19iNpFhQn1US_6g9VpLDsUqtuishSCN822KizTsPN9P1suly2Q_d7NVrfanoLy4F68bYkw7sVLxEEam1jJ0mcjD8'
            }
          ];
          setCourts(mockCourts);
          setSelectedCourt(mockCourts[0]);
        }
      } catch (error) {
        console.error('Error loading courts:', error);
        // Use mock data as fallback
        const mockCourts = [
          {
            id: 1,
            name: 'Court 1',
            status: 'Available',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXYjLJrQr70WG7goVHLT85nNHnHdMWLZRTmuJmvQ1ST1zLhSKKyRlHQB-0PNsmll3SuhEPnlefEHv1tVx-PKwyjU_h3rhnQBSs7FLPAPgJhYEy7FEfWxJTcCtlH9JRX89v6ylKpeMntPbGZmDmEDQjTHcdhvjTa7oksahWrLxMDcDcocL476cXVXworxX0adfUoGpbhFFD5od9gp9WEbCZP7pJv-yYPagEeOm8xaf-UyeIMDRKr2t3T3UvzAC7Fsn9jjH-Ciyy0qo'
          },
          {
            id: 2,
            name: 'Court 2',
            status: 'Unavailable',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBktmqVDxqx603z_WNXlBsK0FrOoU8bzGFuqhIyZysM0vALoMN72PoCOHwAM4ScFmNK-FALh6zrP_V5WZWkfN0PkPBN0ZT2vHCWrl05il5rJH93wHfhbayiRF3T68wd2sbm_RBHgi6R_fIw9SVGtCYoo3XT7jHaTne9YOjxZzTXH83e-swdMbSNLUA6HNiUoXhek7SJJSKSmhN-LoQ-7rv045C6l1h-kUmEPp82EnesaargwlZyMqrNOx7-foQmkYxEYeYzA6yU55s'
          },
          {
            id: 3,
            name: 'Court 3',
            status: 'Available',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABOmZdppcuILP3-aSNCQVu5vEHIUEssoKJ03j_9q87tYyaydw6n5yfI4khq947TL2YCd6Ha67KN8dd5m7HzI2I_kkYW44rYW9iWTEJKjqNwSMkvnImlnk1X4XCV0N0zxAb5AYeLcDeAhrmQQcqrw-C_Bo0qRCDjSMOpetznM9lta0BLji5GHdq2SaDVmkMGiUaYN7OfYpNQbCrWxBtoQ9Gdiv4ICMPz_-OybuaXWO_DOmXEe_N0BwuD8fAfj0tOQOUevPmd2s9NSY'
          },
          {
            id: 4,
            name: 'Court 4',
            status: 'Available',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxQ-a6sCKBrfZGl-OOXna_ubij7Vc5rI3T67zSntCTm7fw1UIqQSPwK-NKj6KuAM8ADL6gl3sw0cGoYUWuNVDaaEBuHxxiS5Uek_7BSbSTtUoxpJ-ewBfZYu1JslrP8HaMmV-Q4bY2UXUbXE8A89gsjTd2kbTY9LaZrPq-pi-CeTXGWyxLNdx19iNpFhQn1US_6g9VpLDsUqtuishSCN822KizTsPN9P1suly2Q_d7NVrfanoLy4F68bYkw7sVLxEEam1jJ0mcjD8'
          }
        ];
        setCourts(mockCourts);
        setSelectedCourt(mockCourts[0]);
      } finally {
        setCourtsLoading(false);
      }
    };

    loadCourts();
  }, [isDemoMode]);

  // Load availability when court or date changes
  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedCourt || !selectedDate) return;

      // Use mock availability in demo mode
      if (isDemoMode) {
        const mockAvailability = getMockCourtAvailability(selectedCourt.id, selectedDate);
        setAvailability(prev => ({
          ...prev,
          [`${selectedCourt.id}-${selectedDate.toDateString()}`]: mockAvailability
        }));
        return;
      }

      try {
        const availabilityData = await bookingApi.getCourtAvailability(selectedCourt.id, selectedDate);
        setAvailability(prev => ({
          ...prev,
          [`${selectedCourt.id}-${selectedDate.toDateString()}`]: availabilityData
        }));
      } catch (error) {
        console.error('Error loading availability:', error);
        // Use mock availability as fallback
        setAvailability(prev => ({
          ...prev,
          [`${selectedCourt.id}-${selectedDate.toDateString()}`]: null
        }));
      }
    };

    loadAvailability();
  }, [isDemoMode, selectedCourt, selectedDate]);

  const handleCourtSelect = (court) => {
    setSelectedCourt(court);
    setSelectedTimeSlot(null); // Reset time slot when court changes
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset time slot when date changes
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleBooking = async () => {
    if (!selectedCourt || !selectedDate || !selectedTimeSlot) {
      alert('Please select a court, date, and time slot');
      return;
    }

    setLoading(true);
    try {
      // Prepare booking data
      const bookingData = {
        court_id: selectedCourt.id,
        start_time: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          selectedTimeSlot.timeSlot.hour,
          0,
          0
        ).toISOString(),
        end_time: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          selectedTimeSlot.timeSlot.hour + 1,
          0,
          0
        ).toISOString(),
        game_type: 'Singles',
        player_count: 2,
        notes: `Booking for ${selectedCourt.name} on ${selectedDate.toDateString()} at ${selectedTimeSlot.time}`
      };

      // Handle booking based on demo mode
      if (isDemoMode) {
        // Simulate successful booking for demo
        alert('Booking successful! (Demo mode - booking simulation)');
      } else {
        try {
          const result = await bookingApi.createBooking(bookingData);
          alert('Booking successful! Your booking ID is: ' + result.id);
        } catch (apiError) {
          console.error('API booking failed:', apiError);
          alert('Booking failed. Please try again or switch to demo mode.');
        }
      }
      
      // Reset form
      setSelectedTimeSlot(null);
      
      // Refresh availability
      if (selectedCourt && selectedDate) {
        try {
          const availabilityData = await bookingApi.getCourtAvailability(selectedCourt.id, selectedDate);
          setAvailability(prev => ({
            ...prev,
            [`${selectedCourt.id}-${selectedDate.toDateString()}`]: availabilityData
          }));
        } catch (error) {
          console.error('Error refreshing availability:', error);
        }
      }
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (courtsLoading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden font-sans">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex items-center justify-center py-20">
                <div className="text-[#0d141c] text-lg">Loading courts...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden font-sans">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Page Title */}
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-[#0d141c] tracking-light text-[32px] font-bold leading-tight min-w-72">
                Book a court
              </p>
            </div>

            {/* Court Selection */}
            <h3 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Select a court
            </h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              {courts.map((court) => (
                <div 
                  key={court.id} 
                  className={`flex flex-col gap-3 pb-3 cursor-pointer rounded-lg p-2 transition-all ${
                    selectedCourt?.id === court.id ? 'bg-blue-50 ring-2 ring-[#0c7ff2]' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleCourtSelect(court)}
                >
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg"
                    style={{ backgroundImage: `url("${court.image}")` }}
                  />
                  <div>
                    <p className="text-[#0d141c] text-base font-medium leading-normal">{court.name}</p>
                    <p className={`text-sm font-normal leading-normal ${
                      court.status === 'Available' ? 'text-[#49739c]' : 'text-red-500'
                    }`}>
                      {court.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Date Selection */}
            <h3 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Select a date
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-6 p-4">
              <Calendar 
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* Time Selection */}
            <h3 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Select a time
            </h3>
            <TimeSlotTable 
              courts={courts}
              selectedCourt={selectedCourt}
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              availability={availability}
              onTimeSlotSelect={handleTimeSlotSelect}
            />

            {/* Booking Summary */}
            {selectedCourt && selectedDate && selectedTimeSlot && (
              <>
                <h3 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
                  Booking summary
                </h3>
                <BookingSummary 
                  court={selectedCourt}
                  date={selectedDate}
                  timeSlot={selectedTimeSlot}
                  onBook={handleBooking}
                  loading={loading}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCourt; 