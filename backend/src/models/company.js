const { Pool } = require('pg');

class Company {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async create(name, slug) {
    const result = await this.pool.query(
      `INSERT INTO companies (name, slug) 
       VALUES ($1, $2) 
       RETURNING company_id, name, slug, logo_url, primary_color`,
      [name, slug]
    );
    return result.rows[0];
  }

  async findBySlug(slug) {
    const result = await this.pool.query(
      `SELECT company_id, name, slug, logo_url, primary_color 
       FROM companies 
       WHERE slug = $1`,
      [slug]
    );
    return result.rows[0];
  }

  async update(companyId, data) {
    const { name, logo_url, primary_color } = data;
    const result = await this.pool.query(
      `UPDATE companies 
       SET name = $1, logo_url = $2, primary_color = $3 
       WHERE company_id = $4 
       RETURNING company_id, name, slug, logo_url, primary_color`,
      [name, logo_url, primary_color, companyId]
    );
    return result.rows[0];
  }
}

module.exports = new Company();