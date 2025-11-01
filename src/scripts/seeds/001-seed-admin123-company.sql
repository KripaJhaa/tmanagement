BEGIN;

-- Create a test company with slug 'admin123' if it doesn't already exist.
INSERT INTO companies (name, logo_url, primary_color, slug)
SELECT 'Admin123 Test Co', NULL, NULL, 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'admin123');

-- Update job with id=2 to belong to this company (adjust job_id if needed)
UPDATE jobs SET company_id = (SELECT company_id FROM companies WHERE slug = 'admin123')
WHERE job_id = 2;

COMMIT;
