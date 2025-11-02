const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class Application {
  static pool = pool;
  
  static async findByCompanyId(companyId) {
    const result = await this.pool.query(
      `SELECT 
        a.application_id,
        a.job_id,
        a.full_name,
        a.email,
        a.phone,
        a.resume_path,
        a.status,
        a.applied_at as created_at,
        j.title as job_title,
        j.job_type,
        j.location
       FROM applications a
       JOIN jobs j ON a.job_id = j.job_id
       WHERE j.company_id = $1
       ORDER BY a.applied_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  static async findById(applicationId, companyId) {
    const result = await this.pool.query(
      `SELECT 
        a.application_id,
        a.job_id,
        a.full_name,
        a.email,
        a.phone,
        a.resume_path,
        a.status,
        a.applied_at as created_at,
        j.title as job_title,
        j.job_type,
        j.location
       FROM applications a
       JOIN jobs j ON a.job_id = j.job_id
       WHERE a.application_id = $1 AND j.company_id = $2`,
      [applicationId, companyId]
    );
    return result.rows[0];
  }

  static async updateStatus(applicationId, status, companyId) {
    const result = await this.pool.query(
      `UPDATE applications a
       SET status = $2
       FROM jobs j
       WHERE a.application_id = $1 
       AND a.job_id = j.job_id 
       AND j.company_id = $3
       RETURNING 
         a.application_id,
         a.job_id,
         a.full_name,
         a.email,
         a.status,
         a.applied_at as created_at`,
      [applicationId, status, companyId]
    );
    return result.rows[0];
  }
}

module.exports = Application;
