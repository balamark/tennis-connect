-- Migration to seed demo data for tennis connect app
-- This creates sample players, courts, and events in San Francisco area

-- Insert demo courts in San Francisco area
INSERT INTO courts (id, name, description, latitude, longitude, zip_code, city, state, image_url, court_type, is_public, contact_info, website, popularity) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Golden Gate Park Tennis Courts', 'Beautiful public courts in the heart of Golden Gate Park with 21 courts available', 37.7694, -122.4862, '94117', 'San Francisco', 'CA', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', 'Hard Court', true, '(415) 831-2700', 'https://sfrecpark.org/facilities/facility/details/Golden-Gate-Park-Tennis-Complex-408', 95),
    ('550e8400-e29b-41d4-a716-446655440002', 'Mission Bay Tennis Club', 'Modern indoor/outdoor facility with professional instruction', 37.7706, -122.3892, '94158', 'San Francisco', 'CA', 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800', 'Hard Court', false, '(415) 777-9880', 'https://missionbaytennis.com', 88),
    ('550e8400-e29b-41d4-a716-446655440003', 'Dolores Park Tennis Courts', 'Popular public courts with great city views', 37.7596, -122.4269, '94114', 'San Francisco', 'CA', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', 'Hard Court', true, '(415) 554-9529', 'https://sfrecpark.org', 82),
    ('550e8400-e29b-41d4-a716-446655440004', 'Presidio Tennis Club', 'Historic club with stunning views of the Golden Gate Bridge', 37.7989, -122.4662, '94129', 'San Francisco', 'CA', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800', 'Clay Court', false, '(415) 561-4268', 'https://presidiotennis.org', 90),
    ('550e8400-e29b-41d4-a716-446655440005', 'Balboa Tennis Complex', 'Large public facility with 14 courts and lessons available', 37.7211, -122.4584, '94112', 'San Francisco', 'CA', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800', 'Hard Court', true, '(415) 337-4816', 'https://sfrecpark.org', 75)
ON CONFLICT (id) DO NOTHING;

-- Insert demo users (top players) in San Francisco area
INSERT INTO users (id, email, password_hash, name, profile_picture, latitude, longitude, zip_code, city, state, skill_level, bio, is_verified, is_new_to_area, gender) VALUES 
    ('550e8400-e29b-41d4-a716-446655440101', 'sarah.chen@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'Sarah Chen', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&crop=face', 37.7749, -122.4194, '94102', 'San Francisco', 'CA', 4.5, 'Former college player, love competitive singles and doubles. Always looking for challenging matches!', true, false, 'Female'),
    ('550e8400-e29b-41d4-a716-446655440102', 'mike.rodriguez@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'Mike Rodriguez', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=400&fit=crop&crop=face', 37.7849, -122.4094, '94108', 'San Francisco', 'CA', 4.2, 'Tennis coach and USTA tournament player. Happy to help beginners improve their game.', true, false, 'Male'),
    ('550e8400-e29b-41d4-a716-446655440103', 'emma.johnson@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'Emma Johnson', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=face', 37.7649, -122.4394, '94114', 'San Francisco', 'CA', 3.8, 'Weekend warrior who loves doubles. New to the city and looking to meet tennis friends!', true, true, 'Female'),
    ('550e8400-e29b-41d4-a716-446655440104', 'david.kim@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'David Kim', 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&h=400&fit=crop&crop=face', 37.7949, -122.4594, '94129', 'San Francisco', 'CA', 4.0, 'Software engineer by day, tennis enthusiast by evening. Love playing at Presidio courts.', true, false, 'Male'),
    ('550e8400-e29b-41d4-a716-446655440105', 'lisa.patel@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'Lisa Patel', 'https://images.unsplash.com/photo-1582655008695-f3d1a00e1b1c?w=400&h=400&fit=crop&crop=face', 37.7549, -122.4149, '94103', 'San Francisco', 'CA', 3.5, 'Beginner-friendly player who enjoys social tennis. Always up for a fun rally session!', true, false, 'Female'),
    ('550e8400-e29b-41d4-a716-446655440106', 'alex.thompson@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'Alex Thompson', 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop&crop=face', 37.7449, -122.4194, '94107', 'San Francisco', 'CA', 4.3, 'Competitive player with 15+ years experience. Looking for regular hitting partners.', true, false, 'Male'),
    ('550e8400-e29b-41d4-a716-446655440107', 'maria.garcia@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'Maria Garcia', 'https://images.unsplash.com/photo-1552308995-2baac1ad5490?w=400&h=400&fit=crop&crop=face', 37.7349, -122.4494, '94110', 'San Francisco', 'CA', 3.9, 'Tennis mom who plays while kids are at school. Love morning matches and clinics.', true, false, 'Female'),
    ('550e8400-e29b-41d4-a716-446655440108', 'james.wilson@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'James Wilson', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face', 37.7649, -122.4094, '94105', 'San Francisco', 'CA', 4.1, 'Former high school tennis captain. Enjoy both singles and doubles, prefer early morning games.', true, false, 'Male'),
    ('550e8400-e29b-41d4-a716-446655440109', 'rachel.brown@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'Rachel Brown', 'https://images.unsplash.com/photo-1564415637254-92c6e4b0b6e3?w=400&h=400&fit=crop&crop=face', 37.7749, -122.4394, '94115', 'San Francisco', 'CA', 3.7, 'Recreational player who loves the social aspect of tennis. Always down for post-game coffee!', true, false, 'Female'),
    ('550e8400-e29b-41d4-a716-446655440110', 'chris.lee@email.com', '$2a$10$dummy.hash.for.demo.purposes.only', 'Chris Lee', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 37.7849, -122.4494, '94118', 'San Francisco', 'CA', 4.4, 'Tournament player and tennis instructor. Available for lessons and competitive matches.', true, false, 'Male')
ON CONFLICT (id) DO NOTHING;

-- Insert user game styles for demo users
INSERT INTO user_game_styles (user_id, game_style_id) 
SELECT u.id, gs.id 
FROM users u, game_styles gs 
WHERE u.email IN ('sarah.chen@email.com', 'mike.rodriguez@email.com', 'alex.thompson@email.com', 'james.wilson@email.com', 'chris.lee@email.com') 
AND gs.name IN ('Singles', 'Competitive')
ON CONFLICT DO NOTHING;

INSERT INTO user_game_styles (user_id, game_style_id) 
SELECT u.id, gs.id 
FROM users u, game_styles gs 
WHERE u.email IN ('emma.johnson@email.com', 'lisa.patel@email.com', 'maria.garcia@email.com', 'rachel.brown@email.com') 
AND gs.name IN ('Doubles', 'Social')
ON CONFLICT DO NOTHING;

INSERT INTO user_game_styles (user_id, game_style_id) 
SELECT u.id, gs.id 
FROM users u, game_styles gs 
WHERE u.email = 'david.kim@email.com' 
AND gs.name IN ('Singles', 'Doubles')
ON CONFLICT DO NOTHING;

-- Insert preferred times for demo users
INSERT INTO preferred_times (user_id, day_of_week, start_time, end_time)
SELECT u.id, 'Saturday', '09:00:00', '12:00:00'
FROM users u 
WHERE u.email LIKE '%@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO preferred_times (user_id, day_of_week, start_time, end_time)
SELECT u.id, 'Sunday', '10:00:00', '14:00:00'
FROM users u 
WHERE u.email LIKE '%@email.com'
ON CONFLICT DO NOTHING;

-- Insert some weekday preferences for working professionals
INSERT INTO preferred_times (user_id, day_of_week, start_time, end_time)
SELECT u.id, 'Tuesday', '18:00:00', '20:00:00'
FROM users u 
WHERE u.email IN ('david.kim@email.com', 'alex.thompson@email.com', 'james.wilson@email.com')
ON CONFLICT DO NOTHING;

INSERT INTO preferred_times (user_id, day_of_week, start_time, end_time)
SELECT u.id, 'Thursday', '18:00:00', '20:00:00'
FROM users u 
WHERE u.email IN ('sarah.chen@email.com', 'mike.rodriguez@email.com', 'chris.lee@email.com')
ON CONFLICT DO NOTHING;

-- Insert court amenities
INSERT INTO court_amenities (court_id, amenity_id)
SELECT c.id, a.id
FROM courts c, amenities a
WHERE c.name = 'Golden Gate Park Tennis Courts' AND a.name IN ('Lights', 'Restrooms', 'Water', 'Seating')
ON CONFLICT DO NOTHING;

INSERT INTO court_amenities (court_id, amenity_id)
SELECT c.id, a.id
FROM courts c, amenities a
WHERE c.name = 'Mission Bay Tennis Club' AND a.name IN ('Lights', 'Restrooms', 'Water', 'Pro Shop', 'Lessons', 'Ball Machine', 'Seating')
ON CONFLICT DO NOTHING;

INSERT INTO court_amenities (court_id, amenity_id)
SELECT c.id, a.id
FROM courts c, amenities a
WHERE c.name = 'Dolores Park Tennis Courts' AND a.name IN ('Restrooms', 'Water', 'Seating')
ON CONFLICT DO NOTHING;

INSERT INTO court_amenities (court_id, amenity_id)
SELECT c.id, a.id
FROM courts c, amenities a
WHERE c.name = 'Presidio Tennis Club' AND a.name IN ('Lights', 'Restrooms', 'Water', 'Pro Shop', 'Lessons', 'Seating')
ON CONFLICT DO NOTHING;

INSERT INTO court_amenities (court_id, amenity_id)
SELECT c.id, a.id
FROM courts c, amenities a
WHERE c.name = 'Balboa Tennis Complex' AND a.name IN ('Lights', 'Restrooms', 'Water', 'Lessons', 'Seating')
ON CONFLICT DO NOTHING;

-- Insert demo events
INSERT INTO events (id, title, description, court_id, latitude, longitude, zip_code, city, state, start_time, end_time, host_id, max_players, skill_level, event_type, is_recurring, is_newcomer_friendly) VALUES 
    ('550e8400-e29b-41d4-a716-446655440201', 'Saturday Morning Open Rally', 'Join us for a fun morning of tennis! All skill levels welcome. We''ll have rotating doubles and singles matches.', '550e8400-e29b-41d4-a716-446655440001', 37.7694, -122.4862, '94117', 'San Francisco', 'CA', NOW() + INTERVAL '4 days' + INTERVAL '9 hours', NOW() + INTERVAL '4 days' + INTERVAL '12 hours', '550e8400-e29b-41d4-a716-446655440102', 16, 'All Levels', 'Open Rally', true, true),
    ('550e8400-e29b-41d4-a716-446655440202', 'Tuesday Evening Doubles', 'Intermediate to advanced doubles play. Partners will be rotated throughout the event.', '550e8400-e29b-41d4-a716-446655440002', 37.7706, -122.3892, '94158', 'San Francisco', 'CA', NOW() + INTERVAL '7 days' + INTERVAL '18 hours', NOW() + INTERVAL '7 days' + INTERVAL '20 hours', '550e8400-e29b-41d4-a716-446655440101', 12, 'Intermediate', 'Doubles', true, false),
    ('550e8400-e29b-41d4-a716-446655440203', 'Beginner Clinic & Social', 'Perfect for new players! Learn basics and meet other beginners in a friendly environment.', '550e8400-e29b-41d4-a716-446655440003', 37.7596, -122.4269, '94114', 'San Francisco', 'CA', NOW() + INTERVAL '5 days' + INTERVAL '10 hours', NOW() + INTERVAL '5 days' + INTERVAL '12 hours', '550e8400-e29b-41d4-a716-446655440102', 8, 'Beginner', 'Clinic', false, true),
    ('550e8400-e29b-41d4-a716-446655440204', 'Competitive Singles Tournament', 'Monthly singles tournament for advanced players. Prizes for winners!', '550e8400-e29b-41d4-a716-446655440004', 37.7989, -122.4662, '94129', 'San Francisco', 'CA', NOW() + INTERVAL '14 days' + INTERVAL '9 hours', NOW() + INTERVAL '14 days' + INTERVAL '17 hours', '550e8400-e29b-41d4-a716-446655440110', 32, 'Advanced', 'Tournament', true, false)
ON CONFLICT (id) DO NOTHING;

-- Insert some event RSVPs
INSERT INTO event_rsvps (event_id, user_id, status) VALUES 
    ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440103', 'Confirmed'),
    ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440105', 'Confirmed'),
    ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440107', 'Confirmed'),
    ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440104', 'Confirmed'),
    ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440106', 'Confirmed'),
    ('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440105', 'Confirmed'),
    ('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440101', 'Confirmed'),
    ('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440106', 'Confirmed'),
    ('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440108', 'Confirmed')
ON CONFLICT DO NOTHING;

-- Insert demo bulletins
INSERT INTO bulletins (id, user_id, title, description, latitude, longitude, zip_code, city, state, court_id, start_time, end_time, skill_level, game_type, is_active) VALUES 
    ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440104', 'Looking for doubles partner', 'Need a doubles partner for regular Tuesday evening games. Intermediate level preferred.', 37.7706, -122.3892, '94158', 'San Francisco', 'CA', '550e8400-e29b-41d4-a716-446655440002', NOW() + INTERVAL '2 days' + INTERVAL '18 hours', NOW() + INTERVAL '2 days' + INTERVAL '20 hours', 'Intermediate', 'Doubles', true),
    ('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440109', 'Morning tennis anyone?', 'Free this Thursday morning for some casual tennis. All levels welcome!', 37.7694, -122.4862, '94117', 'San Francisco', 'CA', '550e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '3 days' + INTERVAL '9 hours', NOW() + INTERVAL '3 days' + INTERVAL '11 hours', 'All Levels', 'Singles', true),
    ('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440106', 'Competitive singles match', 'Looking for a challenging singles match this weekend. 4.0+ level players only.', 37.7989, -122.4662, '94129', 'San Francisco', 'CA', '550e8400-e29b-41d4-a716-446655440004', NOW() + INTERVAL '6 days' + INTERVAL '10 hours', NOW() + INTERVAL '6 days' + INTERVAL '12 hours', 'Advanced', 'Singles', true)
ON CONFLICT (id) DO NOTHING;

-- Insert demo communities
INSERT INTO communities (id, name, description, latitude, longitude, zip_code, city, state, image_url, type, created_by) VALUES 
    ('550e8400-e29b-41d4-a716-446655440401', 'SF Tennis Enthusiasts', 'A community for all tennis lovers in San Francisco. Share tips, organize games, and make friends!', 37.7749, -122.4194, '94102', 'San Francisco', 'CA', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', 'General', '550e8400-e29b-41d4-a716-446655440102'),
    ('550e8400-e29b-41d4-a716-446655440402', 'Women''s Tennis SF', 'Empowering women through tennis. All skill levels welcome in our supportive community.', 37.7749, -122.4194, '94102', 'San Francisco', 'CA', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800', 'Women-only', '550e8400-e29b-41d4-a716-446655440101'),
    ('550e8400-e29b-41d4-a716-446655440403', 'Tennis Beginners Bay Area', 'New to tennis? This is the perfect place to start! Learn, practice, and have fun.', 37.7749, -122.4194, '94102', 'San Francisco', 'CA', 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800', 'Beginners', '550e8400-e29b-41d4-a716-446655440105')
ON CONFLICT (id) DO NOTHING;

-- Insert community members
INSERT INTO community_members (community_id, user_id, role) VALUES 
    ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440102', 'Admin'),
    ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440101', 'Member'),
    ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440104', 'Member'),
    ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440106', 'Member'),
    ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440101', 'Admin'),
    ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440103', 'Member'),
    ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440105', 'Member'),
    ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440107', 'Member'),
    ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440109', 'Member'),
    ('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440105', 'Admin'),
    ('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440103', 'Member'),
    ('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440109', 'Member')
ON CONFLICT DO NOTHING; 