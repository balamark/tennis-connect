-- Drop tables in reverse order of creation (due to foreign key constraints)
DROP TABLE IF EXISTS player_matches;
DROP TABLE IF EXISTS community_messages;
DROP TABLE IF EXISTS community_members;
DROP TABLE IF EXISTS communities;
DROP TABLE IF EXISTS event_rsvps;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS bulletin_responses;
DROP TABLE IF EXISTS bulletins;
DROP TABLE IF EXISTS check_ins;
DROP TABLE IF EXISTS court_amenities;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS courts;
DROP TABLE IF EXISTS preferred_times;
DROP TABLE IF EXISTS user_game_styles;
DROP TABLE IF EXISTS game_styles;
DROP TABLE IF EXISTS users; 