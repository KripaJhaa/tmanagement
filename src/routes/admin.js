const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Authentication middleware
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  try {
    const base64Credentials = (authHeader.split(' ')[1] || '').trim();
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');

    // Credentials can be "username:password" or ":password" (legacy env-based)
    let username = null;
    let providedPassword = credentials;
    if (credentials.includes(':')) {
      const parts = credentials.split(':');
      username = parts[0] || null; // empty string becomes null
      providedPassword = parts.slice(1).join(':');
    }

    // If username provided, try database admin auth
    if (username) {
      const adminRes = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
      if (adminRes.rows.length === 1) {
        const admin = adminRes.rows[0];
        const match = await bcrypt.compare(providedPassword, admin.password_hash);
        if (match) {
          // attach admin info for downstream handlers
          req.admin = { admin_id: admin.admin_id, username: admin.username, company_id: admin.company_id };
          return next();
        }
        return res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Invalid admin credentials' } });
      }
      // if username provided but not found, fall through to check env-based hash (optional)
    }

    // Fallback: legacy env-based single admin password (no username)
    const storedHash = process.env.ADMIN_PASSWORD_HASH;
    if (!storedHash) {
      return res.status(500).json({ success: false, error: { code: 'SERVER_CONFIG', message: 'Admin password hash not configured on server' } });
    }

    const matchEnv = await bcrypt.compare(providedPassword, storedHash);
    if (!matchEnv) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Invalid admin password' } });
    }

    // legacy admin - no req.admin attached
    return next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Authentication failed' } });
  }
};

// Get all applications
// Get all applications (scoped to admin's company when applicable)
router.get('/applications', authenticateAdmin, async (req, res) => {
  try {
    let result;
    if (req.admin?.company_id) {
      result = await pool.query(`
        SELECT a.*, j.title as job_title
        FROM applications a
        JOIN jobs j ON a.job_id = j.job_id
        WHERE j.company_id = $1
        ORDER BY a.applied_at DESC
      `, [req.admin.company_id]);
    } else {
      result = await pool.query(`
        SELECT a.*, j.title as job_title
        FROM applications a
        JOIN jobs j ON a.job_id = j.job_id
        ORDER BY a.applied_at DESC
      `);
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch applications' } });
  }
});

// Update application status
router.patch('/applications/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'reviewed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid status value'
        }
      });
    }

    const result = await pool.query(
      'UPDATE applications SET status = $1 WHERE application_id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Application not found'
        }
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating application:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to update application'
      }
    });
  }
});

// Create a new job (admin only)
router.post('/jobs', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      department = null,
      location = null,
      job_type = null,
      description,
      requirements = null,
      is_active = true
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title and description are required'
        }
      });
    }

    // Determine company association: prefer authenticated admin's company
    let companyId = req.admin?.company_id;
    if (!companyId) {
      // legacy admin must provide company_id explicitly
      if (!req.body.company_id) {
        return res.status(400).json({ success:false, error:{ code:'MISSING_COMPANY', message: 'company_id required for legacy admin' } });
      }
      companyId = req.body.company_id;
      // validate company exists
      const comp = await pool.query('SELECT company_id FROM companies WHERE company_id = $1', [companyId]);
      if (comp.rows.length === 0) return res.status(400).json({ success:false, error:{ code:'INVALID_COMPANY', message:'Company not found' } });
    }

    // Simple slugify: lowercase title, replace non-alphanum with dashes
    const slugBase = (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    // create a job_slug with id suffix (we'll insert and then set job_slug to include id)
    const insert = await pool.query(
      `INSERT INTO jobs (title, department, location, job_type, description, requirements, is_active, company_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, department, location, job_type, description, requirements, is_active, companyId]
    );
    const job = insert.rows[0];
    const jobSlug = `${slugBase}-${job.job_id}`;
    const updated = await pool.query('UPDATE jobs SET job_slug = $1 WHERE job_id = $2 RETURNING *', [jobSlug, job.job_id]);
    res.status(201).json(updated.rows[0]);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to create job'
      }
    });
  }
});

// Public endpoint: register a company + admin user (white-label signup)
router.post('/register', async (req, res) => {
  try {
    const { company_name, logo_url = null, primary_color = null, admin_username, admin_password } = req.body;
    if (!company_name || !admin_username || !admin_password) {
      return res.status(400).json({ success:false, error:{ code:'VALIDATION_ERROR', message: 'company_name, admin_username and admin_password are required' } });
    }

    // Check username uniqueness
    const userCheck = await pool.query('SELECT admin_id FROM admins WHERE username = $1', [admin_username]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ success:false, error:{ code:'USER_EXISTS', message: 'Admin username already exists' } });
    }

    // Create company
    const compRes = await pool.query('INSERT INTO companies (name, logo_url, primary_color) VALUES ($1,$2,$3) RETURNING *', [company_name, logo_url, primary_color]);
    const company = compRes.rows[0];

    // Hash admin password
    const hash = await bcrypt.hash(admin_password, 10);
    const adminRes = await pool.query('INSERT INTO admins (username, password_hash, company_id) VALUES ($1,$2,$3) RETURNING admin_id, username, company_id', [admin_username, hash, company.company_id]);

    res.status(201).json({ company, admin: adminRes.rows[0] });
  } catch (err) {
    console.error('Error registering company/admin:', err);
    res.status(500).json({ success:false, error:{ code:'DB_ERROR', message: 'Failed to register' } });
  }
});

// Get company settings for the authenticated admin
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    // If req.admin present, use company_id, otherwise return generic info (none)
    const companyId = req.admin?.company_id;
    if (!companyId) {
      return res.status(200).json({ company: null });
    }
    const result = await pool.query('SELECT company_id, name, logo_url, primary_color, created_at FROM companies WHERE company_id = $1', [companyId]);
    if (result.rows.length === 0) return res.status(404).json({ success:false, error:{ code:'NOT_FOUND', message:'Company not found' } });
    res.json({ company: result.rows[0] });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ success:false, error:{ code:'DB_ERROR', message: 'Failed to fetch settings' } });
  }
});

// Update company settings (admin)
router.patch('/settings', authenticateAdmin, async (req, res) => {
  try {
    const companyId = req.admin?.company_id;
    if (!companyId) return res.status(403).json({ success:false, error:{ code:'NO_COMPANY', message: 'Admin not associated with a company' } });

    const allowed = ['name','logo_url','primary_color'];
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        fields.push(`${key} = $${idx}`);
        values.push(req.body[key]);
        idx++;
      }
    }
    if (fields.length === 0) return res.status(400).json({ success:false, error:{ code:'NO_FIELDS', message:'No updatable fields provided' } });
    values.push(companyId);
    const query = `UPDATE companies SET ${fields.join(', ')} WHERE company_id = $${idx} RETURNING company_id, name, logo_url, primary_color`;
    const result = await pool.query(query, values);
    res.json({ company: result.rows[0] });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ success:false, error:{ code:'DB_ERROR', message: 'Failed to update settings' } });
  }
});

// Get all jobs (admin view)
router.get('/jobs', authenticateAdmin, async (req, res) => {
  try {
    let result;
    if (req.admin?.company_id) {
      result = await pool.query('SELECT * FROM jobs WHERE company_id = $1 ORDER BY posted_date DESC', [req.admin.company_id]);
    } else {
      result = await pool.query('SELECT * FROM jobs ORDER BY posted_date DESC');
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching jobs (admin):', err);
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: 'Failed to fetch jobs' }
    });
  }
});

// Update job (admin) - partial update
router.patch('/jobs/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // If admin is scoped to a company, verify the job belongs to that company before updating
    if (req.admin?.company_id) {
      const ownerCheck = await pool.query('SELECT company_id FROM jobs WHERE job_id = $1', [id]);
      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ success:false, error:{ code:'NOT_FOUND', message:'Job not found' } });
      }
      if (ownerCheck.rows[0].company_id !== req.admin.company_id) {
        return res.status(403).json({ success:false, error:{ code:'FORBIDDEN', message:'Not allowed to modify jobs for another company' } });
      }
    }
    const allowed = ['title','department','location','job_type','description','requirements','status','is_active'];
    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        fields.push(`${key} = $${idx}`);
        values.push(req.body[key]);
        idx++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success:false, error: { code: 'NO_FIELDS', message: 'No updatable fields provided' } });
    }

    values.push(id);
    const query = `UPDATE jobs SET ${fields.join(', ')} WHERE job_id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success:false, error: { code: 'NOT_FOUND', message: 'Job not found' } });
    }

    // Authorization: if admin is scoped to a company, ensure job belongs to same company
    if (req.admin?.company_id) {
      const job = result.rows[0];
      if (job.company_id !== req.admin.company_id) {
        return res.status(403).json({ success:false, error:{ code:'FORBIDDEN', message:'Not allowed to modify jobs for another company' } });
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ success:false, error: { code: 'DB_ERROR', message: 'Failed to update job' } });
  }
});

module.exports = router;