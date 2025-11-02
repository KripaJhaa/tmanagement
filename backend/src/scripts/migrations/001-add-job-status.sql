-- Migration: add status column to jobs and create index
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='status') THEN
        ALTER TABLE jobs ADD COLUMN status VARCHAR(20) DEFAULT 'published';
    END IF;
END$$;

-- Create composite index for faster retrieval of published jobs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname='idx_jobs_status_posted_date') THEN
        CREATE INDEX idx_jobs_status_posted_date ON jobs(status, posted_date DESC);
    END IF;
END$$;
