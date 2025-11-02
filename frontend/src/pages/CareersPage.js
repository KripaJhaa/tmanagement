import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

import { BriefcaseIcon, MapPinIcon, BuildingOfficeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [sortOrder, setSortOrder] = useState('recent');

  const params = useParams();
  const envCompany = process.env.REACT_APP_COMPANY_SLUG;
  const companySlug = params.companySlug || envCompany || null;

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        if (!companySlug) {
          setJobs([]);
          setError('Company slug missing; visit /:companySlug/jobs or set REACT_APP_COMPANY_SLUG');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/jobs/companies/${companySlug}/jobs`);
        if (Array.isArray(response.data)) {
          setJobs(response.data);
        } else {
          setJobs([]);
          setError('Unexpected response from server when loading jobs');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load jobs. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, [companySlug]);

  const departments = [...new Set(jobs.map(job => job.department).filter(Boolean))];
  
  const filteredJobs = jobs.filter(job => {
    const title = (job.title || '').toLowerCase();
    const department = (job.department || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase()) || department.includes(searchTerm.toLowerCase()) || location.includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === '' || job.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // sort filtered jobs by posted_date
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const dateA = a.posted_date ? new Date(a.posted_date).getTime() : 0;
    const dateB = b.posted_date ? new Date(b.posted_date).getTime() : 0;
    if (sortOrder === 'recent') return dateB - dateA;
    return dateA - dateB;
  });

  function timeAgo(dateString) {
    if (!dateString) return '';
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    const intervals = [
      { label: 'yr', secs: 31536000 },
      { label: 'mo', secs: 2592000 },
      { label: 'd', secs: 86400 },
      { label: 'h', secs: 3600 },
      { label: 'm', secs: 60 },
      { label: 's', secs: 1 }
    ];
    for (const i of intervals) {
      const val = Math.floor(seconds / i.secs);
      if (val >= 1) return `${val}${i.label} ago`;
    }
    return 'just now';
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
          >
            Open Positions
          </motion.h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Join our team and help shape the future
          </p>
        </div>

        <div className="mb-8 space-y-4 sm:flex sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <div className="sm:w-64">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="sm:w-44">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="input"
            >
              <option value="recent">Sort: Most Recent</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedJobs.map((job, index) => (
            <motion.div
              key={job.job_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/${companySlug}/jobs/${job.job_slug}`} className="card group block p-6 h-full">
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {job.title}
                </h2>
                <div className="mt-1 text-sm text-gray-500">Posted {timeAgo(job.posted_date)} • {job.posted_date ? new Date(job.posted_date).toLocaleDateString() : '—'}</div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-gray-600">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{job.department}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <BriefcaseIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{job.job_type}</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center text-primary-600 group-hover:text-primary-700">
                  <span className="text-sm font-medium">View Details</span>
                  <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No positions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default CareersPage;