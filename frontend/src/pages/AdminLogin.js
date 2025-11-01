import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ company_name: '', logo_url: '', primary_color: '', admin_username: '', admin_password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const encodedAuth = btoa(`${username || ''}:${password}`);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/applications`, {
        headers: { Authorization: `Basic ${encodedAuth}` }
      });

      if (response.status === 200) {
        // Save admin credentials (password only) and username if provided
        localStorage.setItem('adminPassword', password);
        if (username) localStorage.setItem('adminUsername', username);

        // Fetch company settings and persist company_id and slug for faster flows
        try {
          const settings = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/settings`, {
            headers: { Authorization: `Basic ${encodedAuth}` }
          });
          if (settings.data?.company) {
            console.log('Persisting company info locally for admin:', settings.data.company);
            localStorage.setItem('companyId', settings.data.company.company_id);
            localStorage.setItem('companySlug', settings.data.company.slug || settings.data.company.name?.toLowerCase().replace(/[^a-z0-9]+/g,'-'));
          }
        } catch (e) {
          // ignore failures here; settings may not exist for legacy admins
        }

        toast.success('Login successful');
        navigate('/admin');
      }
    } catch (err) {
      console.error('Login error', err.response || err.message);
      setError('Authentication failed');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.company_name || !registerData.admin_username || !registerData.admin_password) {
      toast.error('Company name, admin username and password are required');
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/register`, registerData);
      // Persist company + username locally to make sign-in flow smoother
      if (res.data?.company) {
        const company = res.data.company;
        localStorage.setItem('companyId', company.company_id);
        localStorage.setItem('companySlug', company.slug || company.name?.toLowerCase().replace(/[^a-z0-9]+/g,'-'));
      }
      toast.success('Registration successful — you can now sign in');
      setShowRegister(false);
      setUsername(registerData.admin_username);
    } catch (err) {
      console.error('Registration error', err.response || err.message);
      toast.error(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-md w-full mx-4">
        <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="bg-white py-8 px-4 shadow-card rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary-100 p-3">
                <LockClosedIcon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Admin Login</h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Authentication failed</h3>
                    <div className="mt-2 text-sm text-red-700"><p>{error}</p></div>
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username (optional)</label>
              <div className="mt-1">
                <input id="username" name="username" type="text" className="input" placeholder="admin (leave empty for single password)" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input id="password" name="password" type="password" required className="input" placeholder="Enter admin password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="w-1/2 mr-2">
                <button type="submit" disabled={loading} className={`btn w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {loading ? 'Signing in...' : <div className="flex items-center justify-center"><LockClosedIcon className="h-5 w-5 mr-2" />Sign in</div>}
                </button>
              </div>
              <div className="w-1/2">
                <button type="button" onClick={() => setShowRegister(true)} className="btn-outline w-full">Sign up</button>
              </div>
            </div>
          </form>

          {showRegister && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Register Company & Admin</h3>
                  <button onClick={() => setShowRegister(false)} className="text-gray-500">✕</button>
                </div>
                <div className="space-y-3">
                  <input className="input" placeholder="Company name" value={registerData.company_name} onChange={(e) => setRegisterData({ ...registerData, company_name: e.target.value })} />
                  <input className="input" placeholder="Logo URL (optional)" value={registerData.logo_url} onChange={(e) => setRegisterData({ ...registerData, logo_url: e.target.value })} />
                  <input className="input" placeholder="Primary color (hex)" value={registerData.primary_color} onChange={(e) => setRegisterData({ ...registerData, primary_color: e.target.value })} />
                  <input className="input" placeholder="Admin username" value={registerData.admin_username} onChange={(e) => setRegisterData({ ...registerData, admin_username: e.target.value })} />
                  <input className="input" placeholder="Admin password" type="password" value={registerData.admin_password} onChange={(e) => setRegisterData({ ...registerData, admin_password: e.target.value })} />
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowRegister(false)} className="btn-secondary">Cancel</button>
                    <button onClick={handleRegister} className="btn-primary">Register</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </motion.div>
  );
}

export default AdminLogin;
