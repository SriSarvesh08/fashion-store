-- 3 Accessories
INSERT INTO products (name, slug, description, short_description, price, discount_price, category, material, colors, sizes, images, stock, is_active) VALUES
('Classic Pearl Earrings', 'classic-pearl-earrings', 'Elegant freshwater pearl earrings set in sterling silver. Perfect for weddings and formal events.', 'Elegant pearl earrings in silver.', 1500, 1200, 'earrings', 'silver', ARRAY['white', 'silver'], '[]'::jsonb, '[{"url":"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800","alt":"Pearl Earrings","is_front":true}]'::jsonb, 50, true),

('Gold Plated Bangles Set', 'gold-plated-bangles', 'Set of 4 traditional gold-plated bangles with intricate detailing.', 'Set of 4 gold-plated bangles.', 2000, 1800, 'bangles', 'gold', ARRAY['gold'], '[{"label":"2.4","value":"2.4"},{"label":"2.6","value":"2.6"}]'::jsonb, '[{"url":"https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800","alt":"Gold Bangles","is_front":true}]'::jsonb, 20, true),

('Crystal Choker Necklace', 'crystal-choker', 'Sparkling crystal choker necklace for party wear. Adjustable clasp.', 'Sparkling crystal choker necklace.', 3000, NULL, 'necklaces', 'crystal', ARRAY['silver', 'crystal'], '[]'::jsonb, '[{"url":"https://images.unsplash.com/photo-1599643478524-fb66f7fbc304?w=800","alt":"Crystal Choker","is_front":true}]'::jsonb, 15, true);

-- 3 Dresses
INSERT INTO products (name, slug, description, short_description, price, discount_price, category, fabric, fit, length, care_instructions, model_height, colors, sizes, images, stock, is_active) VALUES
('Floral Summer Maxi Dress', 'floral-summer-maxi', 'Lightweight and breathable floral maxi dress perfect for summer days and beach outings.', 'Breathable floral summer maxi dress.', 2500, 1999, 'dresses', 'cotton', 'a-line', 'maxi', 'Machine wash cold. Do not bleach.', '5''7"', ARRAY['blue', 'white'], '[{"label":"S","value":"S"},{"label":"M","value":"M"},{"label":"L","value":"L"}]'::jsonb, '[{"url":"https://images.unsplash.com/photo-1572804013309-8c98e1620025?w=800","alt":"Floral Maxi Dress","is_front":true}]'::jsonb, 30, true),

('Red Bodycon Party Dress', 'red-bodycon-party', 'Stunning red bodycon dress with a sweetheart neckline. Stretchy fabric for a perfect fit.', 'Stunning red bodycon party dress.', 3500, NULL, 'dresses', 'polyester-blend', 'bodycon', 'knee-length', 'Dry clean only.', '5''8"', ARRAY['red'], '[{"label":"XS","value":"XS"},{"label":"S","value":"S"},{"label":"M","value":"M"}]'::jsonb, '[{"url":"https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800","alt":"Red Bodycon Dress","is_front":true}]'::jsonb, 10, true),

('Casual Wrap Midi Dress', 'casual-wrap-midi', 'Comfortable everyday wrap dress with adjustable waist tie and flutter sleeves.', 'Comfortable wrap midi dress.', 2200, 1800, 'dresses', 'viscose', 'wrap', 'midi', 'Hand wash recommended.', '5''6"', ARRAY['black', 'olive'], '[{"label":"M","value":"M"},{"label":"L","value":"L"},{"label":"XL","value":"XL"}]'::jsonb, '[{"url":"https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800","alt":"Wrap Midi Dress","is_front":true}]'::jsonb, 25, true);

-- 1 Admin
INSERT INTO admins (username, password_hash, email) VALUES
('admin', '$2a$10$YourHashedPasswordHere', 'admin@vinozfashion.com');
