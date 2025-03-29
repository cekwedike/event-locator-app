-- Insert test users
INSERT INTO users (email, password, first_name, last_name, role, location)
VALUES 
  ('admin@example.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'User', 'admin', ST_SetSRID(ST_MakePoint(-73.935242, 40.730610), 4326)),
  ('user@example.com', '$2a$10$YourHashedPasswordHere', 'Regular', 'User', 'user', ST_SetSRID(ST_MakePoint(-73.935242, 40.730610), 4326));

-- Insert test categories
INSERT INTO categories (name, description)
VALUES 
  ('Music', 'Live music events and concerts'),
  ('Sports', 'Sports events and competitions'),
  ('Arts', 'Art exhibitions and performances'),
  ('Food', 'Food festivals and culinary events'),
  ('Technology', 'Tech conferences and meetups');

-- Insert test events
INSERT INTO events (title, description, start_date, end_date, location, organizer_id, status)
VALUES 
  ('Summer Music Festival', 'A day of live music performances', NOW() + INTERVAL '1 day', NOW() + INTERVAL '2 days', ST_SetSRID(ST_MakePoint(-73.935242, 40.730610), 4326), 1, 'active'),
  ('Tech Conference 2024', 'Annual technology conference', NOW() + INTERVAL '7 days', NOW() + INTERVAL '8 days', ST_SetSRID(ST_MakePoint(-73.935242, 40.730610), 4326), 1, 'active'),
  ('Food & Wine Festival', 'Culinary delights and wine tasting', NOW() + INTERVAL '14 days', NOW() + INTERVAL '15 days', ST_SetSRID(ST_MakePoint(-73.935242, 40.730610), 4326), 1, 'active');

-- Link events to categories
INSERT INTO event_categories (event_id, category_id)
VALUES 
  (1, 1), -- Summer Music Festival -> Music
  (2, 5), -- Tech Conference 2024 -> Technology
  (3, 4); -- Food & Wine Festival -> Food

-- Insert test reviews
INSERT INTO reviews (event_id, user_id, rating, comment)
VALUES 
  (1, 2, 5, 'Great music festival!'),
  (2, 2, 4, 'Informative tech conference'),
  (3, 2, 5, 'Amazing food and wine!');

-- Insert test event participants
INSERT INTO event_participants (event_id, user_id, status)
VALUES 
  (1, 2, 'registered'),
  (2, 2, 'registered'),
  (3, 2, 'registered');

-- Insert test user favorites
INSERT INTO user_favorites (user_id, event_id)
VALUES 
  (2, 1),
  (2, 2),
  (2, 3); 