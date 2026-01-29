-- Seed data for development
-- Run this after running the migrations

-- Create a test admin user
-- Email: admin@zeroe.io
-- Password: admin123 (bcrypt hash)
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@zeroe.io',
  '$2b$10$/2w1QZUijWflkvkUVPUiE.a9px28abjMac1wmnOem.2yPlhi2DibC',
  'Admin User',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Note: The password hash above is for 'admin123'
-- In production, use a strong password and generate a proper hash
