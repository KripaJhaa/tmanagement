-- Create jobs table
CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    job_type VARCHAR(50),
    description TEXT NOT NULL,
    requirements TEXT,
    status VARCHAR(20) DEFAULT 'published',
    posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create applications table
CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(job_id),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    cover_letter TEXT,
    resume_path VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'new'
);

-- Create indexes
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);

-- New index for fast retrieval of published jobs by date
CREATE INDEX idx_jobs_status_posted_date ON jobs(status, posted_date DESC);