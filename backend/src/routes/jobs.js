const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// NOTE: public routes are company-scoped. Use /api/companies/:slug/jobs to list jobs for a specific company.
// For backward compatibility we still expose / but it returns an informative message.
router.get('/', async (req, res) => {
  res.json({ success: true, message: 'Use /api/companies/:company_slug/jobs to list public jobs for a company' });
});

// Public: list published jobs for a company by company slug
router.get('/companies/:company_slug/jobs', async (req, res) => {
  try {
    const { company_slug } = req.params;
    const q = `
      SELECT j.job_id, j.title, j.department, j.location, j.job_type, j.description, j.requirements, j.posted_date, j.job_slug,
             c.company_id, c.name as company_name, c.slug as company_slug
      FROM jobs j
      JOIN companies c ON j.company_id = c.company_id
      WHERE c.slug = $1 AND j.status = 'published' AND j.is_active = true
      ORDER BY j.posted_date DESC
    `;
    const result = await pool.query(q, [company_slug]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching company jobs:', err);
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch company jobs' } });
  }
});

// Get single job by company slug and job slug (shareable link)
router.get('/companies/:company_slug/jobs/:job_slug', async (req, res) => {
  try {
    const { company_slug, job_slug } = req.params;
    const q = `
      SELECT j.job_id, j.title, j.department, j.location, j.job_type, j.description, j.requirements, j.posted_date, j.job_slug,
             c.company_id, c.name as company_name, c.slug as company_slug
      FROM jobs j
      JOIN companies c ON j.company_id = c.company_id
      WHERE c.slug = $1 AND j.job_slug = $2 AND j.status = 'published' AND j.is_active = true
      LIMIT 1
    `;
    const result = await pool.query(q, [company_slug, job_slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching job by slug:', err);
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch job details' } });
  }
});

// Keep an ID-based lookup (internal/admin use) - returns job regardless of status
router.get('/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM jobs WHERE job_id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success:false, error:{ code:'NOT_FOUND', message:'Job not found' } });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ success:false, error:{ code:'DB_ERROR', message:'Failed to fetch job' } });
  }
});

module.exports = router;