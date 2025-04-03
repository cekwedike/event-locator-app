-- Add category_id to events table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE events ADD COLUMN category_id INTEGER REFERENCES categories(id);
    END IF;
END $$;

-- Create password_reset_tokens table for password reset functionality
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Add additional categories
INSERT INTO categories (name, description, icon) VALUES
    ('Community', 'Community gatherings, meetups, and social events', 'community')
ON CONFLICT (name) DO NOTHING; 