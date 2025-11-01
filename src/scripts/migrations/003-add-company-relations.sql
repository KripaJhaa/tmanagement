-- Migration: add company relations to jobs and add slugs
DO $$
BEGIN
    -- Ensure companies table exists (safe if earlier migration wasn't applied)
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname='companies') THEN
        CREATE TABLE companies (
            company_id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            logo_url VARCHAR(500),
            primary_color VARCHAR(20),
            slug VARCHAR(200),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- add slug to companies if missing (column may already exist from other migrations)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='companies' AND column_name='slug'
    ) THEN
        ALTER TABLE companies ADD COLUMN slug VARCHAR(200);
    END IF;

    -- populate company slugs if empty (simple lower-case dash version of name)
    WITH c AS (
      SELECT company_id, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) AS s FROM companies
    )
    UPDATE companies SET slug = c.s FROM c WHERE companies.company_id = c.company_id AND (companies.slug IS NULL OR companies.slug = '');

    -- add company_id to jobs if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='jobs' AND column_name='company_id'
    ) THEN
        ALTER TABLE jobs ADD COLUMN company_id INTEGER REFERENCES companies(company_id);
    END IF;

    -- add job_slug to jobs if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='jobs' AND column_name='job_slug'
    ) THEN
        ALTER TABLE jobs ADD COLUMN job_slug VARCHAR(300);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_job_slug ON jobs(job_slug);
    END IF;

    -- populate job_slug for existing jobs
    WITH j AS (
      SELECT job_id, lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) AS s FROM jobs
    )
    UPDATE jobs SET job_slug = concat(j.s, '-', jobs.job_id::text) FROM j WHERE jobs.job_id = j.job_id AND (jobs.job_slug IS NULL OR jobs.job_slug = '');
END$$;
