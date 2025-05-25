-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    zip_code VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    skill_level FLOAT NOT NULL,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_new_to_area BOOLEAN DEFAULT FALSE,
    gender VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User game styles table (many-to-many relationship via join table)
CREATE TABLE IF NOT EXISTS game_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_game_styles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_style_id UUID REFERENCES game_styles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, game_style_id)
);

-- User preferred times table
CREATE TABLE IF NOT EXISTS preferred_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- Courts table
CREATE TABLE IF NOT EXISTS courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    zip_code VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    image_url VARCHAR(255),
    court_type VARCHAR(50) NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    contact_info VARCHAR(255),
    website VARCHAR(255),
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Court amenities table
CREATE TABLE IF NOT EXISTS amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS court_amenities (
    court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (court_id, amenity_id)
);

-- Court check-ins table
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    checked_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_out TIMESTAMP WITH TIME ZONE
);

-- Bulletins table
CREATE TABLE IF NOT EXISTS bulletins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude FLOAT,
    longitude FLOAT,
    zip_code VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    skill_level VARCHAR(50),
    game_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulletin responses table
CREATE TABLE IF NOT EXISTS bulletin_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulletin_id UUID REFERENCES bulletins(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) NOT NULL, -- Pending, Accepted, Declined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    latitude FLOAT,
    longitude FLOAT,
    zip_code VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    host_id UUID REFERENCES users(id) ON DELETE CASCADE,
    max_players INTEGER NOT NULL,
    skill_level VARCHAR(50),
    event_type VARCHAR(50) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    is_newcomer_friendly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- Confirmed, Waitlisted, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communities table
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude FLOAT,
    longitude FLOAT,
    zip_code VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    image_url VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- General, Women-only, Beginners, etc.
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community members table
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- Admin, Moderator, Member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (community_id, user_id)
);

-- Community messages table
CREATE TABLE IF NOT EXISTS community_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reply_to UUID REFERENCES community_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player matches table (for like functionality)
CREATE TABLE IF NOT EXISTS player_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user1_liked BOOLEAN DEFAULT FALSE,
    user2_liked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user1_id, user2_id)
);

-- Insert default game styles
INSERT INTO game_styles (name) VALUES 
    ('Singles'),
    ('Doubles'),
    ('Competitive'),
    ('Social')
ON CONFLICT (name) DO NOTHING;

-- Insert default amenities
INSERT INTO amenities (name) VALUES 
    ('Lights'),
    ('Restrooms'),
    ('Water'),
    ('Pro Shop'),
    ('Lessons'),
    ('Ball Machine'),
    ('Seating')
ON CONFLICT (name) DO NOTHING; 