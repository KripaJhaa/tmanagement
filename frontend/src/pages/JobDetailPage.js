import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';

import { motion } from 'framer-motion';
import { 
  BriefcaseIcon, 
  MapPinIcon, 
  BuildingOfficeIcon,
  CalendarIcon,
  PaperClipIcon,
  XCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function JobDetailPage() {
  const { id, companySlug, jobSlug } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm({
    mode: 'onChange'
  });

  const selectedFile = watch('resume');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        // Support both legacy id-based route and new company/jobSlug route
        let response;
        if (companySlug && jobSlug) {
          response = await axios.get(`${process.env.REACT_APP_API_URL}/api/jobs/companies/${companySlug}/jobs/${jobSlug}`);
        } else if (id) {
          response = await axios.get(`${process.env.REACT_APP_API_URL}/api/jobs/id/${id}`);
        } else {
          throw new Error('Missing job identifier');
        }
        setJob(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load job details. Please try again later.');
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'resume') {
          formData.append(key, data[key][0]);
        } else {
          formData.append(key, data[key]);
        }
      });
  formData.append('job_id', job.job_id);

      await axios.post(`${process.env.REACT_APP_API_URL}/api/applications`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmitStatus('success');
      toast.success('Application submitted successfully!');
      reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitStatus('error');
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 mr-2" />
            <span>{error || 'Job not found'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-12"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="text-sm mb-4">
            <Link to={companySlug ? `/${companySlug}/jobs` : '/'} className="text-primary-600 hover:text-primary-700">
              ← Back to Jobs
            </Link>
          </motion.div>

          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="bg-white rounded-lg shadow-sm p-8"
          >
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center text-gray-600">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                <span>{job.department}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPinIcon className="h-5 w-5 mr-2" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                <span>{job.job_type}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="h-5 w-5 mr-2" />
                <span>{new Date(job.posted_date).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.description }} />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.requirements }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow-sm p-8 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">Apply Now</h2>

              {submitStatus === 'success' && (
                <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-md flex items-start">
                  <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Application Submitted!</p>
                    <p className="text-sm">We'll review your application and get back to you soon.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="full_name">
                    Full Name *
                  </label>
                  <input
                    {...register('full_name', { required: 'Full name is required' })}
                    type="text"
                    className="input mt-1"
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                    Email *
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                        message: 'Please enter a valid email'
                      }
                    })}
                    type="email"
                    className="input mt-1"
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="input mt-1"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="cover_letter">
                    Cover Letter
                  </label>
                  <textarea
                    {...register('cover_letter')}
                    rows="4"
                    className="input mt-1"
                    placeholder="Tell us why you're interested in this position..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="resume">
                    Resume * (PDF or DOCX, max 5MB)
                  </label>
                  <div className="mt-1">
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-500 transition-colors">
                      <div className="space-y-1 text-center">
                        <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="resume" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                            <span>Upload a file</span>
                            <input
                              {...register('resume', {
                                required: 'Resume is required',
                                validate: {
                                  fileSize: (files) => 
                                    !files[0] || files[0].size <= 5242880 || 'File size must be less than 5MB',
                                  fileType: (files) =>
                                    !files[0] || 
                                    ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                                      .includes(files[0].type) ||
                                    'File must be PDF or DOCX'
                                }
                              })}
                              type="file"
                              id="resume"
                              accept=".pdf,.docx"
                              className="sr-only"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          {selectedFile?.[0]?.name || 'PDF or DOCX up to 5MB'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {errors.resume && (
                    <p className="mt-1 text-sm text-red-600">{errors.resume.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className={`btn w-full ${(!isValid || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default JobDetailPage;