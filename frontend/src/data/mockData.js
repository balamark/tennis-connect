// Centralized mock data for demo mode
// This file contains all static demo data to avoid database dependency
// in production and ensure consistent demo experience across all components

// Mock Players Data
export const getMockPlayers = () => [
  {
    id: '1',
    name: 'Roger Federer',
    email: 'roger@tennislegends.com',
    skillLevel: 6.5,
    location: { city: 'San Francisco', state: 'CA' },
    gameStyles: ['Singles', 'Doubles', 'Competitive'],
    gender: 'Male',
    isNewToArea: false,
    isVerified: true,
    bio: 'Former World No. 1 and 20-time Grand Slam champion. Known for his elegant style and incredible technique. Looking for hitting partners who appreciate the artistry of tennis.',
    preferredTimes: [
      { dayOfWeek: 'Saturday', startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 'Sunday', startTime: '14:00', endTime: '17:00' },
      { dayOfWeek: 'Wednesday', startTime: '10:00', endTime: '12:00' }
    ],
    distance: 2.5
  },
  {
    id: '2',
    name: 'Rafael Nadal',
    email: 'rafa@tennislegends.com',
    skillLevel: 6.5,
    location: { city: 'San Francisco', state: 'CA' },
    gameStyles: ['Singles', 'Competitive'],
    gender: 'Male',
    isNewToArea: false,
    isVerified: true,
    bio: 'The King of Clay! 22-time Grand Slam champion known for incredible fighting spirit and topspin forehand. Always ready for intense training sessions.',
    preferredTimes: [
      { dayOfWeek: 'Monday', startTime: '06:00', endTime: '09:00' },
      { dayOfWeek: 'Wednesday', startTime: '06:00', endTime: '09:00' },
      { dayOfWeek: 'Friday', startTime: '06:00', endTime: '09:00' }
    ],
    distance: 3.2
  },
  {
    id: '3',
    name: 'Novak Djokovic',
    email: 'novak@tennislegends.com',
    skillLevel: 6.5,
    location: { city: 'San Francisco', state: 'CA' },
    gameStyles: ['Singles', 'Competitive'],
    gender: 'Male',
    isNewToArea: false,
    isVerified: true,
    bio: '23-time Grand Slam champion with incredible flexibility and mental strength. Master of all surfaces. Looking for challenging matches.',
    preferredTimes: [
      { dayOfWeek: 'Tuesday', startTime: '07:00', endTime: '10:00' },
      { dayOfWeek: 'Thursday', startTime: '07:00', endTime: '10:00' },
      { dayOfWeek: 'Sunday', startTime: '08:00', endTime: '11:00' }
    ],
    distance: 4.1
  },
  {
    id: '4',
    name: 'Serena Williams',
    email: 'serena@tennislegends.com',
    skillLevel: 6.5,
    location: { city: 'San Francisco', state: 'CA' },
    gameStyles: ['Singles', 'Doubles', 'Competitive'],
    gender: 'Female',
    isNewToArea: false,
    isVerified: true,
    bio: '23-time Grand Slam singles champion and the greatest female tennis player of all time. Powerful serve and incredible determination. Champion mindset.',
    preferredTimes: [
      { dayOfWeek: 'Monday', startTime: '10:00', endTime: '13:00' },
      { dayOfWeek: 'Wednesday', startTime: '15:00', endTime: '18:00' },
      { dayOfWeek: 'Saturday', startTime: '10:00', endTime: '13:00' }
    ],
    distance: 5.8
  },
  {
    id: '5',
    name: 'Carlos Alcaraz',
    email: 'carlos@tennislegends.com',
    skillLevel: 6.0,
    location: { city: 'Oakland', state: 'CA' },
    gameStyles: ['Singles', 'Competitive'],
    gender: 'Male',
    isNewToArea: true,
    isVerified: true,
    bio: 'Young World No. 1 with explosive power and incredible court coverage. The future of tennis! Always excited to practice and improve.',
    preferredTimes: [
      { dayOfWeek: 'Tuesday', startTime: '14:00', endTime: '17:00' },
      { dayOfWeek: 'Thursday', startTime: '14:00', endTime: '17:00' },
      { dayOfWeek: 'Saturday', startTime: '09:00', endTime: '12:00' }
    ],
    distance: 12.3
  },
  {
    id: '6',
    name: 'Steffi Graf',
    email: 'steffi@tennislegends.com',
    skillLevel: 6.5,
    location: { city: 'Berkeley', state: 'CA' },
    gameStyles: ['Singles', 'Competitive'],
    gender: 'Female',
    isNewToArea: false,
    isVerified: true,
    bio: 'Tennis legend with 22 Grand Slam titles and the only player to achieve the Golden Slam. Known for powerful forehand and incredible athleticism.',
    preferredTimes: [
      { dayOfWeek: 'Friday', startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 'Saturday', startTime: '15:00', endTime: '18:00' },
      { dayOfWeek: 'Sunday', startTime: '10:00', endTime: '13:00' }
    ],
    distance: 16.7
  },
  {
    id: '7',
    name: 'Andy Murray',
    email: 'andy@tennislegends.com',
    skillLevel: 6.0,
    location: { city: 'San Jose', state: 'CA' },
    gameStyles: ['Singles', 'Doubles'],
    gender: 'Male',
    isNewToArea: false,
    isVerified: true,
    bio: '3-time Grand Slam champion and former World No. 1. Master tactician with incredible defensive skills. Olympic gold medalist.',
    preferredTimes: [
      { dayOfWeek: 'Monday', startTime: '16:00', endTime: '19:00' },
      { dayOfWeek: 'Wednesday', startTime: '16:00', endTime: '19:00' },
      { dayOfWeek: 'Friday', startTime: '16:00', endTime: '19:00' }
    ],
    distance: 22.1
  },
  {
    id: '8',
    name: 'Iga Swiatek',
    email: 'iga@tennislegends.com',
    skillLevel: 6.0,
    location: { city: 'Palo Alto', state: 'CA' },
    gameStyles: ['Singles', 'Competitive'],
    gender: 'Female',
    isNewToArea: true,
    isVerified: true,
    bio: 'Current World No. 1 with incredible mental strength and powerful topspin. Multiple Grand Slam champion who loves to compete at the highest level.',
    preferredTimes: [
      { dayOfWeek: 'Tuesday', startTime: '11:00', endTime: '14:00' },
      { dayOfWeek: 'Thursday', startTime: '11:00', endTime: '14:00' },
      { dayOfWeek: 'Sunday', startTime: '13:00', endTime: '16:00' }
    ],
    distance: 25.4
  }
];

// Mock Bulletins Data
export const getMockBulletins = () => [
  {
    id: 'b1',
    title: 'Looking for doubles partner this weekend',
    description: 'Need a doubles partner for Saturday morning at Golden Gate Park. Intermediate level preferred (3.5-4.0). We have court reserved for 10 AM.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94117'
    },
    skillLevel: 'Intermediate',
    gameType: 'Doubles',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    isActive: true,
    author: 'David Kim',
    courtName: 'Golden Gate Park Tennis Courts',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    responses: 3
  },
  {
    id: 'b2',
    title: 'Morning tennis anyone?',
    description: 'Free this Thursday morning for some casual tennis. All levels welcome! Let\'s have fun and get some exercise.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94117'
    },
    skillLevel: 'All Levels',
    gameType: 'Singles',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    isActive: true,
    author: 'Rachel Brown',
    courtName: 'Golden Gate Park Tennis Courts',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    responses: 1
  },
  {
    id: 'b3',
    title: 'Competitive singles match',
    description: 'Looking for a challenging singles match this weekend. 4.0+ level players only. Let\'s play at Presidio courts.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94129'
    },
    skillLevel: 'Advanced',
    gameType: 'Singles',
    startTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    isActive: true,
    author: 'Alex Thompson',
    courtName: 'Presidio Tennis Club',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    responses: 2
  },
  {
    id: 'b4',
    title: 'Evening doubles group',
    description: 'Regular Tuesday evening doubles group looking for more players. We meet every week at Mission Bay Tennis Club.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94158'
    },
    skillLevel: 'Intermediate',
    gameType: 'Doubles',
    startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    isActive: true,
    author: 'Sarah Chen',
    courtName: 'Mission Bay Tennis Club',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    responses: 5
  }
];

// Mock Courts Data
export const getMockCourts = () => [
  {
    id: 'c1',
    name: 'Golden Gate Park Tennis Courts',
    description: 'Beautiful public courts in the heart of Golden Gate Park with 21 courts available',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94117',
      latitude: 37.7694,
      longitude: -122.4862
    },
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
    courtType: 'Hard Court',
    isPublic: true,
    contactInfo: '(415) 831-2700',
    website: 'https://sfrecpark.org/facilities/facility/details/Golden-Gate-Park-Tennis-Complex-408',
    amenities: ['Lights', 'Restrooms', 'Water', 'Seating'],
    status: 'Available',
    popularity: 95,
    hourlyRate: 0 // Free public court
  },
  {
    id: 'c2',
    name: 'Mission Bay Tennis Club',
    description: 'Modern indoor/outdoor facility with professional instruction',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94158',
      latitude: 37.7706,
      longitude: -122.3892
    },
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800',
    courtType: 'Hard Court',
    isPublic: false,
    contactInfo: '(415) 777-9880',
    website: 'https://missionbaytennis.com',
    amenities: ['Lights', 'Restrooms', 'Water', 'Pro Shop', 'Lessons', 'Ball Machine', 'Seating'],
    status: 'Available',
    popularity: 88,
    hourlyRate: 45
  },
  {
    id: 'c3',
    name: 'Dolores Park Tennis Courts',
    description: 'Popular public courts with great city views',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94114',
      latitude: 37.7596,
      longitude: -122.4269
    },
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
    courtType: 'Hard Court',
    isPublic: true,
    contactInfo: '(415) 554-9529',
    website: 'https://sfrecpark.org',
    amenities: ['Restrooms', 'Water', 'Seating'],
    status: 'Available',
    popularity: 82,
    hourlyRate: 0 // Free public court
  },
  {
    id: 'c4',
    name: 'Presidio Tennis Club',
    description: 'Historic club with stunning views of the Golden Gate Bridge',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94129',
      latitude: 37.7989,
      longitude: -122.4662
    },
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
    courtType: 'Clay Court',
    isPublic: false,
    contactInfo: '(415) 561-4268',
    website: 'https://presidiotennis.org',
    amenities: ['Lights', 'Restrooms', 'Water', 'Pro Shop', 'Lessons', 'Seating'],
    status: 'Available',
    popularity: 90,
    hourlyRate: 55
  }
];

// Mock Events Data
export const getMockEvents = () => [
  {
    id: 'e1',
    title: 'Saturday Morning Open Rally',
    description: 'Join us for a fun morning of tennis! All skill levels welcome. We\'ll have rotating doubles and singles matches.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94117',
      latitude: 37.7694,
      longitude: -122.4862
    },
    startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(), // 4 days from now at 9 AM
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(), // 4 days from now at 12 PM
    host: 'Mike Rodriguez',
    maxPlayers: 16,
    currentPlayers: 8,
    skillLevel: 'All Levels',
    eventType: 'Open Rally',
    isRecurring: true,
    isNewcomerFriendly: true,
    courtName: 'Golden Gate Park Tennis Courts',
    rsvps: [
      { userName: 'Emma Johnson', status: 'Confirmed' },
      { userName: 'Lisa Patel', status: 'Confirmed' },
      { userName: 'Maria Garcia', status: 'Confirmed' },
      { userName: 'Player 1', status: 'Confirmed' } // For demo purposes
    ]
  },
  {
    id: 'e2',
    title: 'Tuesday Evening Doubles',
    description: 'Intermediate to advanced doubles play. Partners will be rotated throughout the event.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94158',
      latitude: 37.7706,
      longitude: -122.3892
    },
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString(), // 7 days from now at 6 PM
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000).toISOString(), // 7 days from now at 8 PM
    host: 'Sarah Chen',
    maxPlayers: 12,
    currentPlayers: 6,
    skillLevel: 'Intermediate',
    eventType: 'Doubles',
    isRecurring: true,
    isNewcomerFriendly: false,
    courtName: 'Mission Bay Tennis Club',
    rsvps: [
      { userName: 'David Kim', status: 'Confirmed' },
      { userName: 'Alex Thompson', status: 'Confirmed' }
    ]
  },
  {
    id: 'e3',
    title: 'Beginner Clinic & Social',
    description: 'Perfect for new players! Learn basics and meet other beginners in a friendly environment.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94114',
      latitude: 37.7596,
      longitude: -122.4269
    },
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), // 5 days from now at 10 AM
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(), // 5 days from now at 12 PM
    host: 'Mike Rodriguez',
    maxPlayers: 8,
    currentPlayers: 5,
    skillLevel: 'Beginner',
    eventType: 'Clinic',
    isRecurring: false,
    isNewcomerFriendly: true,
    courtName: 'Dolores Park Tennis Courts',
    rsvps: [
      { userName: 'Lisa Patel', status: 'Confirmed' }
    ]
  }
];

// Mock Communities Data
export const getMockCommunities = () => [
  {
    id: 'comm1',
    name: 'SF Tennis Enthusiasts',
    description: 'A community for all tennis lovers in San Francisco. Share tips, organize games, and make friends!',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      latitude: 37.7749,
      longitude: -122.4194
    },
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
    type: 'General',
    createdBy: 'Mike Rodriguez',
    memberCount: 156,
    isUserMember: true,
    members: [
      { userName: 'Current User', role: 'Member' },
      { userName: 'Sarah Chen', role: 'Member' },
      { userName: 'David Kim', role: 'Member' },
      { userName: 'Alex Thompson', role: 'Member' }
    ]
  },
  {
    id: 'comm2',
    name: 'Women\'s Tennis SF',
    description: 'Empowering women through tennis. All skill levels welcome in our supportive community.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      latitude: 37.7749,
      longitude: -122.4194
    },
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800',
    type: 'Women-only',
    createdBy: 'Sarah Chen',
    memberCount: 89,
    isUserMember: false,
    members: [
      { userName: 'Emma Johnson', role: 'Member' },
      { userName: 'Lisa Patel', role: 'Member' },
      { userName: 'Maria Garcia', role: 'Member' },
      { userName: 'Rachel Brown', role: 'Member' }
    ]
  },
  {
    id: 'comm3',
    name: 'Tennis Beginners Bay Area',
    description: 'New to tennis? This is the perfect place to start! Learn, practice, and have fun.',
    location: {
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      latitude: 37.7749,
      longitude: -122.4194
    },
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800',
    type: 'Beginners',
    createdBy: 'Lisa Patel',
    memberCount: 42,
    isUserMember: false,
    members: [
      { userName: 'Emma Johnson', role: 'Member' },
      { userName: 'Rachel Brown', role: 'Member' }
    ]
  }
];

// Mock Sessions/Bookings Data
export const getMockSessions = () => [
  {
    id: 1,
    court_id: 1,
    court_name: 'Golden Gate Park Tennis Courts',
    start_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
    game_type: 'Singles',
    player_count: 2,
    status: 'confirmed',
    notes: 'Casual singles match with Chris Lee',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: 2,
    court_id: 2,
    court_name: 'Mission Bay Tennis Club',
    start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
    game_type: 'Doubles',
    player_count: 4,
    status: 'confirmed',
    notes: 'Evening doubles match with local players',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: 3,
    court_id: 4,
    court_name: 'Presidio Tennis Club',
    start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
    game_type: 'Singles',
    player_count: 2,
    status: 'confirmed',
    notes: 'Competitive singles match with Ethan Wong',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
  },
  {
    id: 4,
    court_id: 3,
    court_name: 'Dolores Park Tennis Courts',
    start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
    game_type: 'Singles',
    player_count: 2,
    status: 'completed',
    notes: 'Great match with Sophia Chen!',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  }
];

// Mock Court Availability Data
export const getMockCourtAvailability = (courtId, date) => {
  const timeSlots = [];
  const dateStr = date.toDateString();
  
  // Generate availability for 8 AM to 8 PM
  for (let hour = 8; hour < 20; hour++) {
    const isAvailable = Math.random() > 0.3; // 70% availability rate
    timeSlots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      timeSlot: {
        hour: hour,
        available: isAvailable,
        price: courtId === 'c1' || courtId === 'c3' ? 0 : 45 // Free for public courts
      },
      available: isAvailable
    });
  }
  
  return timeSlots;
}; 