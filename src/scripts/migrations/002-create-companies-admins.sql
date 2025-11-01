-- Migration: create companies and admins tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname='companies') THEN
        CREATE TABLE companies (
            company_id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            logo_url VARCHAR(500),
            primary_color VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname='admins') THEN
        CREATE TABLE admins (
            admin_id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(200) NOT NULL,
            company_id INTEGER REFERENCES companies(company_id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END$$;
