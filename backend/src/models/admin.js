const { Pool } = require('pg');
const bcrypt = require('bcrypt');

class Admin {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async findByUsername(username) {
    const result = await this.pool.query(
      `SELECT a.*, c.slug as company_slug 
       FROM admins a 
       JOIN companies c ON a.company_id = c.company_id 
       WHERE username = $1`,
      [username]
    );
    return result.rows[0];
  }

  async findByCompanyId(companyId) {
    const result = await this.pool.query(
      `SELECT a.*, c.slug as company_slug 
       FROM admins a 
       JOIN companies c ON a.company_id = c.company_id 
       WHERE a.company_id = $1`,
      [companyId]
    );
    return result.rows[0];
  }

  async create(username, password, companyId) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await this.pool.query(
      `INSERT INTO admins (username, password_hash, company_id) 
       VALUES ($1, $2, $3) 
       RETURNING admin_id, username, company_id`,
      [username, passwordHash, companyId]
    );
    return result.rows[0];
  }

  async verifyPassword(admin, password) {
    return bcrypt.compare(password, admin.password_hash);
  }
}

module.exports = new Admin();