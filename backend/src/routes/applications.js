const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Email configuration removed for MVP

// Submit application
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { job_id, full_name, email, phone, cover_letter } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'Resume file is required'
        }
      });
    }

    // Email validation
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please enter a valid email address'
        }
      });
    }

    // Insert application into database
    const result = await pool.query(
      'INSERT INTO applications (job_id, full_name, email, phone, cover_letter, resume_path, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [job_id, full_name, email, phone, cover_letter, req.file.path, 'new']
    );

    // Skip email confirmation for MVP
    // Just log that the application was received
    console.log(`Application received from ${full_name} for job ${job_id}`);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to submit application'
      }
    });
  }
});

module.exports = router;