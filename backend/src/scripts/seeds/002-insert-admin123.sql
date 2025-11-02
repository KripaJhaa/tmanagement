BEGIN;

-- Ensure admins table exists (in case migration wasn't applied)
CREATE TABLE IF NOT EXISTS admins (
  admin_id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  company_id INTEGER REFERENCES companies(company_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure company exists (defensive)
INSERT INTO companies (name, logo_url, primary_color, slug)
SELECT 'Admin123 Test Co', NULL, NULL, 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'admin123');

-- Insert DB-backed admin 'admin123' for company with slug 'admin123' if not exists
INSERT INTO admins (username, password_hash, company_id)
SELECT 'admin123', '$2b$10$mVVVtBkVIewrJiLWS1Cs.OaM.mfLVbmKxVqVLHTRVswGE3Bv0sBea', c.company_id
FROM companies c
WHERE c.slug = 'admin123'
  AND NOT EXISTS (SELECT 1 FROM admins a WHERE a.username = 'admin123');

COMMIT;
