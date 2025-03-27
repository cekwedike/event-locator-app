-- Insert test users (only if they don't exist)
INSERT INTO users (username, email, password, is_admin)
SELECT 'admin', 'admin@eventlocator.com', '$2b$10$YourHashedPasswordHere', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO users (username, email, password, is_admin)
SELECT 'john_doe', 'john@example.com', '$2b$10$YourHashedPasswordHere', false
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'john_doe');

INSERT INTO users (username, email, password, is_admin)
SELECT 'jane_smith', 'jane@example.com', '$2b$10$YourHashedPasswordHere', false
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'jane_smith');

-- Insert test categories (only if they don't exist)
INSERT INTO categories (name, description)
SELECT 'Music', 'Live music events, concerts, and performances'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Music');

INSERT INTO categories (name, description)
SELECT 'Sports', 'Sports events, tournaments, and competitions'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sports');

INSERT INTO categories (name, description)
SELECT 'Food & Drink', 'Food festivals, wine tastings, and culinary events'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Food & Drink');

INSERT INTO categories (name, description)
SELECT 'Arts & Culture', 'Art exhibitions, theater performances, and cultural events'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Arts & Culture');

INSERT INTO categories (name, description)
SELECT 'Technology', 'Tech conferences, hackathons, and workshops'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Technology');

INSERT INTO categories (name, description)
SELECT 'Business', 'Business conferences, networking events, and seminars'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Business');

INSERT INTO categories (name, description)
SELECT 'Education', 'Educational workshops, classes, and training sessions'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Education');

INSERT INTO categories (name, description)
SELECT 'Community', 'Community gatherings, meetups, and social events'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Community');

-- Insert test events (only if they don't exist)
INSERT INTO events (
  title, description, location, address, start_date, end_date,
  max_participants, price, created_by
)
SELECT 
  'Summer Music Festival',
  'A day of live music featuring local bands',
  ST_SetSRID(ST_MakePoint(-73.935242, 40.730610), 4326),
  '123 Park Ave, New York, NY',
  CURRENT_TIMESTAMP + INTERVAL '1 day',
  CURRENT_TIMESTAMP + INTERVAL '2 days',
  1000,
  50.00,
  (SELECT id FROM users WHERE username = 'john_doe')
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Summer Music Festival');

INSERT INTO events (
  title, description, location, address, start_date, end_date,
  max_participants, price, created_by
)
SELECT 
  'Tech Conference 2024',
  'Annual technology conference',
  ST_SetSRID(ST_MakePoint(-74.006015, 40.712776), 4326),
  '456 Broadway, New York, NY',
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  CURRENT_TIMESTAMP + INTERVAL '9 days',
  500,
  200.00,
  (SELECT id FROM users WHERE username = 'john_doe')
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Tech Conference 2024');

INSERT INTO events (
  title, description, location, address, start_date, end_date,
  max_participants, price, created_by
)
SELECT 
  'Food & Wine Festival',
  'Taste the best local cuisine and wines',
  ST_SetSRID(ST_MakePoint(-73.985130, 40.758896), 4326),
  '789 5th Ave, New York, NY',
  CURRENT_TIMESTAMP + INTERVAL '14 days',
  CURRENT_TIMESTAMP + INTERVAL '15 days',
  800,
  75.00,
  (SELECT id FROM users WHERE username = 'jane_smith')
WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Food & Wine Festival');

-- Link events to categories (only if they don't exist)
INSERT INTO event_categories (event_id, category_id)
SELECT e.id, c.id
FROM events e, categories c
WHERE e.title = 'Summer Music Festival' AND c.name = 'Music'
AND NOT EXISTS (
  SELECT 1 FROM event_categories 
  WHERE event_id = e.id AND category_id = c.id
);

INSERT INTO event_categories (event_id, category_id)
SELECT e.id, c.id
FROM events e, categories c
WHERE e.title = 'Tech Conference 2024' AND c.name = 'Technology'
AND NOT EXISTS (
  SELECT 1 FROM event_categories 
  WHERE event_id = e.id AND category_id = c.id
);

INSERT INTO event_categories (event_id, category_id)
SELECT e.id, c.id
FROM events e, categories c
WHERE e.title = 'Tech Conference 2024' AND c.name = 'Business'
AND NOT EXISTS (
  SELECT 1 FROM event_categories 
  WHERE event_id = e.id AND category_id = c.id
);

INSERT INTO event_categories (event_id, category_id)
SELECT e.id, c.id
FROM events e, categories c
WHERE e.title = 'Food & Wine Festival' AND c.name = 'Food & Drink'
AND NOT EXISTS (
  SELECT 1 FROM event_categories 
  WHERE event_id = e.id AND category_id = c.id
);

-- Insert test reviews (only if they don't exist)
INSERT INTO reviews (user_id, event_id, rating, comment)
SELECT 
  (SELECT id FROM users WHERE username = 'jane_smith'),
  (SELECT id FROM events WHERE title = 'Summer Music Festival'),
  5,
  'Amazing festival! Great music and atmosphere.'
WHERE NOT EXISTS (
  SELECT 1 FROM reviews 
  WHERE user_id = (SELECT id FROM users WHERE username = 'jane_smith')
  AND event_id = (SELECT id FROM events WHERE title = 'Summer Music Festival')
);

INSERT INTO reviews (user_id, event_id, rating, comment)
SELECT 
  (SELECT id FROM users WHERE username = 'john_doe'),
  (SELECT id FROM events WHERE title = 'Summer Music Festival'),
  4,
  'Good event overall, but could use more food vendors.'
WHERE NOT EXISTS (
  SELECT 1 FROM reviews 
  WHERE user_id = (SELECT id FROM users WHERE username = 'john_doe')
  AND event_id = (SELECT id FROM events WHERE title = 'Summer Music Festival')
);

INSERT INTO reviews (user_id, event_id, rating, comment)
SELECT 
  (SELECT id FROM users WHERE username = 'jane_smith'),
  (SELECT id FROM events WHERE title = 'Tech Conference 2024'),
  5,
  'Excellent conference with great speakers.'
WHERE NOT EXISTS (
  SELECT 1 FROM reviews 
  WHERE user_id = (SELECT id FROM users WHERE username = 'jane_smith')
  AND event_id = (SELECT id FROM events WHERE title = 'Tech Conference 2024')
);

INSERT INTO reviews (user_id, event_id, rating, comment)
SELECT 
  (SELECT id FROM users WHERE username = 'john_doe'),
  (SELECT id FROM events WHERE title = 'Food & Wine Festival'),
  4,
  'Great food and wine selection. Will come back next year.'
WHERE NOT EXISTS (
  SELECT 1 FROM reviews 
  WHERE user_id = (SELECT id FROM users WHERE username = 'john_doe')
  AND event_id = (SELECT id FROM events WHERE title = 'Food & Wine Festival')
);

-- Insert test event participants (only if they don't exist)
INSERT INTO event_participants (event_id, user_id, status)
SELECT 
  (SELECT id FROM events WHERE title = 'Summer Music Festival'),
  (SELECT id FROM users WHERE username = 'john_doe'),
  'registered'
WHERE NOT EXISTS (
  SELECT 1 FROM event_participants 
  WHERE event_id = (SELECT id FROM events WHERE title = 'Summer Music Festival')
  AND user_id = (SELECT id FROM users WHERE username = 'john_doe')
);

INSERT INTO event_participants (event_id, user_id, status)
SELECT 
  (SELECT id FROM events WHERE title = 'Summer Music Festival'),
  (SELECT id FROM users WHERE username = 'jane_smith'),
  'registered'
WHERE NOT EXISTS (
  SELECT 1 FROM event_participants 
  WHERE event_id = (SELECT id FROM events WHERE title = 'Summer Music Festival')
  AND user_id = (SELECT id FROM users WHERE username = 'jane_smith')
);

INSERT INTO event_participants (event_id, user_id, status)
SELECT 
  (SELECT id FROM events WHERE title = 'Tech Conference 2024'),
  (SELECT id FROM users WHERE username = 'john_doe'),
  'registered'
WHERE NOT EXISTS (
  SELECT 1 FROM event_participants 
  WHERE event_id = (SELECT id FROM events WHERE title = 'Tech Conference 2024')
  AND user_id = (SELECT id FROM users WHERE username = 'john_doe')
);

INSERT INTO event_participants (event_id, user_id, status)
SELECT 
  (SELECT id FROM events WHERE title = 'Food & Wine Festival'),
  (SELECT id FROM users WHERE username = 'jane_smith'),
  'registered'
WHERE NOT EXISTS (
  SELECT 1 FROM event_participants 
  WHERE event_id = (SELECT id FROM events WHERE title = 'Food & Wine Festival')
  AND user_id = (SELECT id FROM users WHERE username = 'jane_smith')
);

-- Insert test event images (only if they don't exist)
INSERT INTO event_images (event_id, image_url, is_primary)
SELECT 
  (SELECT id FROM events WHERE title = 'Summer Music Festival'),
  'https://example.com/images/music-festival.jpg',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM event_images 
  WHERE event_id = (SELECT id FROM events WHERE title = 'Summer Music Festival')
  AND image_url = 'https://example.com/images/music-festival.jpg'
);

INSERT INTO event_images (event_id, image_url, is_primary)
SELECT 
  (SELECT id FROM events WHERE title = 'Tech Conference 2024'),
  'https://example.com/images/tech-conference.jpg',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM event_images 
  WHERE event_id = (SELECT id FROM events WHERE title = 'Tech Conference 2024')
  AND image_url = 'https://example.com/images/tech-conference.jpg'
);

INSERT INTO event_images (event_id, image_url, is_primary)
SELECT 
  (SELECT id FROM events WHERE title = 'Food & Wine Festival'),
  'https://example.com/images/food-festival.jpg',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM event_images 
  WHERE event_id = (SELECT id FROM events WHERE title = 'Food & Wine Festival')
  AND image_url = 'https://example.com/images/food-festival.jpg'
);

-- Insert test user favorites (only if they don't exist)
INSERT INTO user_favorites (user_id, event_id)
SELECT 
  (SELECT id FROM users WHERE username = 'john_doe'),
  (SELECT id FROM events WHERE title = 'Summer Music Festival')
WHERE NOT EXISTS (
  SELECT 1 FROM user_favorites 
  WHERE user_id = (SELECT id FROM users WHERE username = 'john_doe')
  AND event_id = (SELECT id FROM events WHERE title = 'Summer Music Festival')
);

INSERT INTO user_favorites (user_id, event_id)
SELECT 
  (SELECT id FROM users WHERE username = 'jane_smith'),
  (SELECT id FROM events WHERE title = 'Tech Conference 2024')
WHERE NOT EXISTS (
  SELECT 1 FROM user_favorites 
  WHERE user_id = (SELECT id FROM users WHERE username = 'jane_smith')
  AND event_id = (SELECT id FROM events WHERE title = 'Tech Conference 2024')
);

INSERT INTO user_favorites (user_id, event_id)
SELECT 
  (SELECT id FROM users WHERE username = 'john_doe'),
  (SELECT id FROM events WHERE title = 'Food & Wine Festival')
WHERE NOT EXISTS (
  SELECT 1 FROM user_favorites 
  WHERE user_id = (SELECT id FROM users WHERE username = 'john_doe')
  AND event_id = (SELECT id FROM events WHERE title = 'Food & Wine Festival')
); 