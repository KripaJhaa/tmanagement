import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  EnvelopeIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function StatusBadge({ status }) {
  const styles = {
    new: 'bg-blue-100 text-blue-800',
    reviewed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`badge ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('applied_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    job_type: '',
    description: '',
    requirements: '',
    is_active: true
  });
  const [jobs, setJobs] = useState([]);
  const storedCompanyId = localStorage.getItem('companyId');
  const storedCompanySlug = localStorage.getItem('companySlug');
  const [editingJobId, setEditingJobId] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const adminPassword = localStorage.getItem('adminPassword');
    const adminUsername = localStorage.getItem('adminUsername') || '';
    if (!adminPassword) {
      navigate('/admin/login');
      return;
    }

    const authHeader = () => `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`;

    const fetchApplications = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/applications`, {
          headers: {
            Authorization: authHeader(),
            'Content-Type': 'application/json'
          }
        });
        setApplications(response.data);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('adminPassword');
          navigate('/admin/login');
        } else {
          setError('Failed to load applications');
          toast.error('Failed to load applications');
          setLoading(false);
        }
      }
    };

    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/jobs`, {
          headers: {
            Authorization: authHeader()
          }
        });
        setJobs(res.data);
      } catch (err) {
        console.error('Failed to load admin jobs', err);
      }
    };

    fetchApplications();
    fetchJobs();
  }, [navigate]);

  const handleJobStatusChange = async (jobId, newStatus) => {
    try {
      const adminPassword = localStorage.getItem('adminPassword');
      const adminUsername = localStorage.getItem('adminUsername') || '';
      const res = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/admin/jobs/${jobId}`,
        { status: newStatus },
        { headers: { Authorization: `Basic ${btoa(`${adminUsername}:${adminPassword}`)}` } }
      );
      setJobs(jobs.map(j => (j.job_id === jobId ? res.data : j)));
      toast.success('Job updated');
    } catch (err) {
      console.error('Failed to update job', err);
      toast.error('Failed to update job');
    }
  };

  const handleEditJob = (job) => {
    setEditingJobId(job.job_id);
    setNewJob({
      title: job.title || '',
      department: job.department || '',
      location: job.location || '',
      job_type: job.job_type || '',
      description: job.description || '',
      requirements: job.requirements || '',
      is_active: job.is_active
    });
    setCreateModalOpen(true);
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const adminPassword = localStorage.getItem('adminPassword');
      const adminUsername = localStorage.getItem('adminUsername') || '';
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/admin/applications/${applicationId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`
          }
        }
      );

      setApplications(applications.map(app =>
        app.application_id === applicationId ? { ...app, status: newStatus } : app
      ));
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminPassword');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = 
        app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (fieldA < fieldB) return -1 * direction;
      if (fieldA > fieldB) return 1 * direction;
      return 0;
    });

  const stats = {
    total: applications.length,
    new: applications.filter(app => app.status === 'new').length,
    reviewed: applications.filter(app => app.status === 'reviewed').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 bg-red-50 px-4 py-3 rounded-md shadow-sm">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Applications Dashboard</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary flex items-center"
            >
              + Create Job
            </button>

            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary-100 p-3">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
                <EnvelopeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.new}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Reviewed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.reviewed}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-red-100 p-3">
                <ChartBarIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="relative flex-1 max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input sm:w-40"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="rejected">Rejected</option>
                </select>

                <button
                  onClick={() => {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                  className="btn-secondary"
                >
                  <FunnelIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr
                    key={application.application_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{application.job_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(application.applied_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(application.applied_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`${process.env.REACT_APP_API_URL}/${application.resume_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary inline-flex items-center text-sm"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={application.status}
                        onChange={(e) => handleStatusChange(application.application_id, e.target.value)}
                        className="input text-sm py-1"
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Jobs management section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Jobs Management</h2>
          <div className="text-sm text-gray-500">{jobs.length} jobs</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map(job => (
                  <tr key={job.job_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(job.posted_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {/* Only show public link when we have both company slug and job slug */}
                      {storedCompanySlug && job.job_slug ? (
                        <a
                          href={`/${storedCompanySlug}/jobs/${job.job_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          View Public
                        </a>
                      ) : (
                        <span className="text-gray-400">Unavailable</span>
                      )}
                      {/* Developer hint: show job_slug if missing so admins know to run migration/seed */}
                      {!job.job_slug && (
                        <div className="text-xs text-gray-400 mt-1">(missing job slug)</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={job.status || 'published'}
                        onChange={(e) => handleJobStatusChange(job.job_id, e.target.value)}
                        className="input"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="paused">Paused</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => handleEditJob(job)} className="btn-secondary mr-2">Edit</button>
                      {storedCompanySlug && (
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/${storedCompanySlug}/jobs/${job.job_slug}`;
                            navigator.clipboard?.writeText(url).then(() => toast.success('Public URL copied'));
                          }}
                          className="btn-outline"
                        >
                          Copy Link
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && (
              <div className="p-6 text-center text-gray-500">No jobs created yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create New Job</h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-500">✕</button>
            </div>

            <div className="space-y-3">
              <input
                className="input"
                placeholder="Job title"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="Department"
                  value={newJob.department}
                  onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Location"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                />
              </div>
              <input
                className="input"
                placeholder="Job type (e.g., Full-time)"
                value={newJob.job_type}
                onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
              />
              <textarea
                className="input h-32"
                placeholder="Full job description"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              />
              <textarea
                className="input h-20"
                placeholder="Requirements (comma separated or paragraphs)"
                value={newJob.requirements}
                onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
              />

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Basic client-side validation
                    if (!newJob.title.trim() || !newJob.description.trim()) {
                      toast.error('Please provide title and description');
                      return;
                    }

                    try {
                      // re-read auth and stored company info at click time to avoid stale values
                      const adminPassword = localStorage.getItem('adminPassword');
                      const adminUsername = localStorage.getItem('adminUsername') || '';
                      let storedCompanyIdNow = localStorage.getItem('companyId');
                      if (editingJobId) {
                        // Update existing job
                        const res = await axios.patch(
                          `${process.env.REACT_APP_API_URL}/api/admin/jobs/${editingJobId}`,
                          newJob,
                          {
                            headers: {
                              Authorization: `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`,
                              'Content-Type': 'application/json'
                            }
                          }
                        );
                        setJobs(jobs.map(j => (j.job_id === editingJobId ? res.data : j)));
                        toast.success('Job updated');
                      } else {
                          // Create new job
                          // If adminUsername is not present (legacy single-password admin), backend requires company_id.
                          const payload = { ...newJob };
                          if (!adminUsername) {
                            // Prefer stored companyId if available (set at login/register)
                            if (storedCompanyIdNow) {
                              // coerce to number if possible
                              payload.company_id = Number(storedCompanyIdNow) || storedCompanyIdNow;
                            } else {
                              try {
                                const settingsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/settings`, {
                                  headers: { Authorization: `Basic ${btoa(`:${adminPassword}`)}` }
                                });
                                const companyId = settingsRes.data?.company?.company_id;
                                if (companyId) {
                                  payload.company_id = companyId;
                                  localStorage.setItem('companyId', String(companyId));
                                }
                              } catch (e) {
                                // ignore — backend will return an error which we handle below
                              }
                            }
                          }

                          let response;
                          try {
                            response = await axios.post(
                              `${process.env.REACT_APP_API_URL}/api/admin/jobs`,
                              payload,
                              {
                                headers: {
                                  Authorization: `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`,
                                  'Content-Type': 'application/json'
                                }
                              }
                            );
                          } catch (postErr) {
                            // If backend complains about missing company for legacy admin, try to fetch company_id and retry once
                            const missingCompany = postErr?.response?.data?.error?.code === 'MISSING_COMPANY';
                            if (missingCompany) {
                              try {
                                // Try using storedCompanyId first
                                let resolvedCompanyId = storedCompanyId;
                                if (!resolvedCompanyId) {
                                  const settingsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/settings`, {
                                    headers: { Authorization: `Basic ${btoa(`${adminUsername}:${adminPassword}`)}` }
                                  });
                                  resolvedCompanyId = settingsRes.data?.company?.company_id;
                                  // persist for future
                                  if (resolvedCompanyId) localStorage.setItem('companyId', String(resolvedCompanyId));
                                }

                                if (resolvedCompanyId) {
                                  payload.company_id = resolvedCompanyId;
                                  response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/jobs`, payload, {
                                    headers: {
                                      Authorization: `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`,
                                      'Content-Type': 'application/json'
                                    }
                                  });
                                } else {
                                  throw postErr;
                                }
                              } catch (retryErr) {
                                throw retryErr;
                              }
                            } else {
                              throw postErr;
                            }
                          }

                          setJobs([response.data, ...(jobs || [])]);
                          toast.success('Job created');
                      }

                      setCreateModalOpen(false);
                      setEditingJobId(null);
                      // Optionally clear form
                      setNewJob({ title: '', department: '', location: '', job_type: '', description: '', requirements: '', is_active: true });
                    } catch (err) {
                      console.error('Create/update job error', err);
                      toast.error('Failed to save job');
                    }
                  }}
                  className="btn-primary"
                >
                  {editingJobId ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}


export default AdminDashboard;