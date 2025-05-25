-- Down migration to remove demo data

-- Remove community members
DELETE FROM community_members WHERE community_id IN (
    '550e8400-e29b-41d4-a716-446655440401',
    '550e8400-e29b-41d4-a716-446655440402',
    '550e8400-e29b-41d4-a716-446655440403'
);

-- Remove demo communities
DELETE FROM communities WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440401',
    '550e8400-e29b-41d4-a716-446655440402',
    '550e8400-e29b-41d4-a716-446655440403'
);

-- Remove demo bulletins
DELETE FROM bulletins WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440302',
    '550e8400-e29b-41d4-a716-446655440303'
);

-- Remove event RSVPs
DELETE FROM event_rsvps WHERE event_id IN (
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440202',
    '550e8400-e29b-41d4-a716-446655440203',
    '550e8400-e29b-41d4-a716-446655440204'
);

-- Remove demo events
DELETE FROM events WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440201',
    '550e8400-e29b-41d4-a716-446655440202',
    '550e8400-e29b-41d4-a716-446655440203',
    '550e8400-e29b-41d4-a716-446655440204'
);

-- Remove court amenities for demo courts
DELETE FROM court_amenities WHERE court_id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005'
);

-- Remove preferred times for demo users
DELETE FROM preferred_times WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@email.com'
);

-- Remove user game styles for demo users
DELETE FROM user_game_styles WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@email.com'
);

-- Remove demo users
DELETE FROM users WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440102',
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440104',
    '550e8400-e29b-41d4-a716-446655440105',
    '550e8400-e29b-41d4-a716-446655440106',
    '550e8400-e29b-41d4-a716-446655440107',
    '550e8400-e29b-41d4-a716-446655440108',
    '550e8400-e29b-41d4-a716-446655440109',
    '550e8400-e29b-41d4-a716-446655440110'
);

-- Remove demo courts
DELETE FROM courts WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005'
); 