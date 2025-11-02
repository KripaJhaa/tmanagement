const { Pool } = require('pg');

class Job {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async findByCompanyId(companyId) {
    const result = await this.pool.query(
      `SELECT j.*, c.slug as company_slug 
       FROM jobs j 
       JOIN companies c ON j.company_id = c.company_id 
       WHERE j.company_id = $1 
       ORDER BY j.posted_date DESC`,
      [companyId]
    );
    return result.rows;
  }

  async findById(id) {
    const result = await this.pool.query(
      `SELECT j.*, c.slug as company_slug 
       FROM jobs j 
       JOIN companies c ON j.company_id = c.company_id 
       WHERE j.job_id = $1`,
      [id]
    );
    return result.rows[0];
  }

  async create(jobData) {
    const {
      title,
      description,
      requirements,
      company_id,
      status = 'draft',
      job_type,
      location,
      salary_range
    } = jobData;

    const result = await this.pool.query(
      `INSERT INTO jobs (
        title, description, requirements, company_id, 
        status, job_type, location, salary_range, 
        posted_date, job_slug
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 
        CURRENT_TIMESTAMP,
        lower(regexp_replace($1, '[^a-z0-9]+', '-', 'g'))
      ) RETURNING *`,
      [title, description, requirements, company_id, 
       status, job_type, location, salary_range]
    );
    return result.rows[0];
  }

  async update(jobData) {
    const {
      id,
      title,
      description,
      requirements,
      status,
      job_type,
      location,
      salary_range
    } = jobData;

    let job_slug = null;
    if (title) {
      job_slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const updates = [];
    const values = [];
    let valueIndex = 1;

    if (title) {
      updates.push(`title = $${valueIndex}`);
      values.push(title);
      valueIndex++;
    }
    if (description) {
      updates.push(`description = $${valueIndex}`);
      values.push(description);
      valueIndex++;
    }
    if (requirements) {
      updates.push(`requirements = $${valueIndex}`);
      values.push(requirements);
      valueIndex++;
    }
    if (status) {
      updates.push(`status = $${valueIndex}`);
      values.push(status);
      valueIndex++;
    }
    if (job_type) {
      updates.push(`job_type = $${valueIndex}`);
      values.push(job_type);
      valueIndex++;
    }
    if (location) {
      updates.push(`location = $${valueIndex}`);
      values.push(location);
      valueIndex++;
    }
    if (salary_range) {
      updates.push(`salary_range = $${valueIndex}`);
      values.push(salary_range);
      valueIndex++;
    }
    if (job_slug) {
      updates.push(`job_slug = $${valueIndex}`);
      values.push(job_slug);
      valueIndex++;
    }

    values.push(id);

    const result = await this.pool.query(
      `UPDATE jobs SET ${updates.join(', ')} 
       WHERE id = $${valueIndex} 
       RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

module.exports = new Job();