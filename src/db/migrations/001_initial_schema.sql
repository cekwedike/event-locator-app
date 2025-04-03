-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            preferred_language VARCHAR(10) DEFAULT 'en',
            location GEOGRAPHY(POINT, 4326),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Create event_categories table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'event_categories') THEN
        CREATE TABLE event_categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Create events table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'events') THEN
        CREATE TABLE events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            location GEOGRAPHY(POINT, 4326) NOT NULL,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            category_id INTEGER REFERENCES event_categories(id),
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT valid_time_range CHECK (end_time > start_time)
        );
    END IF;
END $$;

-- Create event_ratings table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'event_ratings') THEN
        CREATE TABLE event_ratings (
            id SERIAL PRIMARY KEY,
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            review TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(event_id, user_id)
        );
    END IF;
END $$;

-- Create saved_events table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'saved_events') THEN
        CREATE TABLE saved_events (
            id SERIAL PRIMARY KEY,
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(event_id, user_id)
        );
    END IF;
END $$;

-- Create notifications table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications') THEN
        CREATE TABLE notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_location') THEN
        CREATE INDEX idx_users_location ON users USING GIST (location);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_location') THEN
        CREATE INDEX idx_events_location ON events USING GIST (location);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_start_time') THEN
        CREATE INDEX idx_events_start_time ON events(start_time);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_category') THEN
        CREATE INDEX idx_events_category ON events(category_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_ratings_event') THEN
        CREATE INDEX idx_event_ratings_event ON event_ratings(event_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_events_user') THEN
        CREATE INDEX idx_saved_events_user ON saved_events(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user') THEN
        CREATE INDEX idx_notifications_user ON notifications(user_id);
    END IF;
END $$;

-- Insert default categories if they don't exist
INSERT INTO event_categories (name, description)
SELECT 'Music', 'Concerts, festivals, and musical performances'
WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Music');

INSERT INTO event_categories (name, description)
SELECT 'Sports', 'Sports events, tournaments, and competitions'
WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Sports');

INSERT INTO event_categories (name, description)
SELECT 'Arts', 'Art exhibitions, theater performances, and cultural events'
WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Arts');

INSERT INTO event_categories (name, description)
SELECT 'Food', 'Food festivals, cooking workshops, and culinary events'
WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Food');

INSERT INTO event_categories (name, description)
SELECT 'Technology', 'Tech conferences, workshops, and meetups'
WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Technology');

INSERT INTO event_categories (name, description)
SELECT 'Business', 'Business conferences, networking events, and seminars'
WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Business');

INSERT INTO event_categories (name, description)
SELECT 'Education', 'Workshops, seminars, and educational events'
WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Education');

INSERT INTO event_categories (name, description)
SELECT 'Entertainment', 'Entertainment events, shows, and performances'
WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Entertainment');

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_events_updated_at') THEN
        CREATE TRIGGER update_events_updated_at
            BEFORE UPDATE ON events
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_event_ratings_updated_at') THEN
        CREATE TRIGGER update_event_ratings_updated_at
            BEFORE UPDATE ON event_ratings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$; 