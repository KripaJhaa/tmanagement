const Admin = require('../models/admin');
const Company = require('../models/company');
const Job = require('../models/job');
const Application = require('../models/application');

class AdminController {
  async getSettings(req, res) {
    try {
      const { admin } = req;
      res.json({
        success: true,
        data: {
          username: admin.username,
          company: {
            id: admin.company_id,
            slug: admin.company_slug
          }
        }
      });
    } catch (err) {
      console.error('Get settings error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get settings' }
      });
    }
  }

  async getJobs(req, res) {
    try {
      const { admin } = req;
      const jobs = await Job.findByCompanyId(admin.company_id);
      
      res.json({
        success: true,
        data: jobs
      });
    } catch (err) {
      console.error('Get jobs error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get jobs' }
      });
    }
  }

  async createJob(req, res) {
    try {
      const { admin } = req;
      const jobData = {
        ...req.body,
        company_id: admin.company_id,
        status: req.body.status || 'draft'
      };

      const job = await Job.create(jobData);
      
      res.status(201).json({
        success: true,
        data: job
      });
    } catch (err) {
      console.error('Create job error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create job' }
      });
    }
  }

  async updateJob(req, res) {
    try {
      const { admin } = req;
      const { id } = req.params;
      
      // Verify job belongs to admin's company
      const existingJob = await Job.findById(id);
      if (!existingJob || existingJob.company_id !== admin.company_id) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Job not found' }
        });
      }

      const jobData = {
        ...req.body,
        id: id,
        company_id: admin.company_id
      };

      const updatedJob = await Job.update(jobData);
      
      res.json({
        success: true,
        data: updatedJob
      });
    } catch (err) {
      console.error('Update job error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update job' }
      });
    }
  }

  async getApplications(req, res) {
    try {
      const { admin } = req;
      const applications = await Application.findByCompanyId(admin.company_id);
      
      res.json({
        success: true,
        data: applications
      });
    } catch (err) {
      console.error('Get applications error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get applications' }
      });
    }
  }

  async updateApplication(req, res) {
    try {
      const { admin } = req;
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: 'Status is required' }
        });
      }

      // Validate status
      const validStatuses = ['new', 'reviewing', 'contacted', 'interviewing', 'offered', 'hired', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Invalid status value' }
        });
      }

      const application = await Application.updateStatus(id, status, admin.company_id);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Application not found' }
        });
      }

      res.json({
        success: true,
        data: application
      });
    } catch (err) {
      console.error('Update application error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update application' }
      });
    }
  }

  async register(req, res) {
    const { company_name, company_slug, username, password } = req.body;

    if (!company_name || !company_slug || !username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'All fields are required' }
      });
    }

    try {
      // Create company first
      const company = await Company.create(company_name, company_slug);
      
      // Then create admin
      const admin = await Admin.create(username, password, company.id);

      res.status(201).json({
        success: true,
        data: {
          username: admin.username,
          company: {
            id: company.id,
            name: company.name,
            slug: company.slug
          }
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE_ENTRY', message: 'Company slug or username already exists' }
        });
      }
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Registration failed' }
      });
    }
  }
}

module.exports = {
  getSettings: (req, res) => new AdminController().getSettings(req, res),
  getJobs: (req, res) => new AdminController().getJobs(req, res),
  createJob: (req, res) => new AdminController().createJob(req, res),
  updateJob: (req, res) => new AdminController().updateJob(req, res),
  getApplications: (req, res) => new AdminController().getApplications(req, res),
  updateApplication: (req, res) => new AdminController().updateApplication(req, res),
  register: (req, res) => new AdminController().register(req, res)
};