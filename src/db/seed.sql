-- Insert test users
INSERT INTO users (username, email, password, is_admin) VALUES
('admin', 'admin@eventlocator.com', '$2b$10$YourHashedPasswordHere', true),
('john_doe', 'john@example.com', '$2b$10$YourHashedPasswordHere', false),
('jane_smith', 'jane@example.com', '$2b$10$YourHashedPasswordHere', false);

-- Insert test categories
INSERT INTO categories (name, description) VALUES
('Music', 'Live music events, concerts, and performances'),
('Sports', 'Sports events, tournaments, and competitions'),
('Food & Drink', 'Food festivals, wine tastings, and culinary events'),
('Arts & Culture', 'Art exhibitions, theater performances, and cultural events'),
('Technology', 'Tech conferences, hackathons, and workshops'),
('Business', 'Business conferences, networking events, and seminars'),
('Education', 'Educational workshops, classes, and training sessions'),
('Community', 'Community gatherings, meetups, and social events');

-- Insert test events
INSERT INTO events (
  title, description, location, address, start_date, end_date,
  max_participants, price, created_by
) VALUES
(
  'Summer Music Festival',
  'A day of live music featuring local bands',
  ST_SetSRID(ST_MakePoint(-73.935242, 40.730610), 4326),
  '123 Park Ave, New York, NY',
  CURRENT_TIMESTAMP + INTERVAL '1 day',
  CURRENT_TIMESTAMP + INTERVAL '2 days',
  1000,
  50.00,
  2
),
(
  'Tech Conference 2024',
  'Annual technology conference',
  ST_SetSRID(ST_MakePoint(-74.006015, 40.712776), 4326),
  '456 Broadway, New York, NY',
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  CURRENT_TIMESTAMP + INTERVAL '9 days',
  500,
  200.00,
  2
),
(
  'Food & Wine Festival',
  'Taste the best local cuisine and wines',
  ST_SetSRID(ST_MakePoint(-73.985130, 40.758896), 4326),
  '789 5th Ave, New York, NY',
  CURRENT_TIMESTAMP + INTERVAL '14 days',
  CURRENT_TIMESTAMP + INTERVAL '15 days',
  800,
  75.00,
  3
);

-- Link events to categories
INSERT INTO event_categories (event_id, category_id) VALUES
(1, 1), -- Summer Music Festival -> Music
(2, 5), -- Tech Conference 2024 -> Technology
(2, 6), -- Tech Conference 2024 -> Business
(3, 3); -- Food & Wine Festival -> Food & Drink

-- Insert test reviews
INSERT INTO reviews (user_id, event_id, rating, comment) VALUES
(3, 1, 5, 'Amazing festival! Great music and atmosphere.'),
(2, 1, 4, 'Good event overall, but could use more food vendors.'),
(3, 2, 5, 'Excellent conference with great speakers.'),
(2, 3, 4, 'Great food and wine selection. Will come back next year.');

-- Insert test event participants
INSERT INTO event_participants (event_id, user_id, status) VALUES
(1, 2, 'registered'),
(1, 3, 'registered'),
(2, 2, 'registered'),
(3, 3, 'registered');

-- Insert test event images
INSERT INTO event_images (event_id, image_url, is_primary) VALUES
(1, 'https://example.com/images/music-festival.jpg', true),
(2, 'https://example.com/images/tech-conference.jpg', true),
(3, 'https://example.com/images/food-festival.jpg', true);

-- Insert test user favorites
INSERT INTO user_favorites (user_id, event_id) VALUES
(2, 1),
(3, 2),
(2, 3); 