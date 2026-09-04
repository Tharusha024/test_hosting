import React, { useState, useEffect } from 'react';

// Dynamic API URL for local dev & hosted deployment (strips trailing slash automatically)
const rawApiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_BASE = rawApiBase.replace(/\/+$/, '');


export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [usersList, setUsersList] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Something went wrong');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setCurrentUser(null);
  };

  // Fetch admin user management list
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(usersList.filter(u => u._id !== id));
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token && currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [token, currentUser]);

  // Auth Form View
  if (!token) {
    return (
      <div className="app-container">
        <div className="card">
          <div className="auth-header">
            <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p>{isLogin ? 'Sign in to access your dashboard' : 'Join our User/Admin Portal'}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleAuthSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>Account Role</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
            </button>
          </form>

          <div className="toggle-auth">
            {isLogin ? (
              <p>Don't have an account? <span onClick={() => setIsLogin(false)}>Sign Up</span></p>
            ) : (
              <p>Already have an account? <span onClick={() => setIsLogin(true)}>Sign In</span></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Logged-in View
  return (
    <div className="app-container">
      <div className="card">
        <div className="dashboard-nav">
          <div>
            <h2>Hello, {currentUser?.name}!</h2>
            <span className={`badge ${currentUser?.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
              {currentUser?.role} Account
            </span>
          </div>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </div>

        {currentUser?.role === 'admin' ? (
          <div>
            <h3>Admin Management Dashboard</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              MongoDB Atlas User Directory (Total: {usersList.length})
            </p>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u._id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="btn btn-danger"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <h3>User Dashboard</h3>
            <p style={{ color: 'var(--text-muted)' }}>Welcome to your profile center.</p>

            <div className="profile-info">
              <p><strong>Name:</strong> {currentUser?.name}</p>
              <p><strong>Email:</strong> {currentUser?.email}</p>
              <p><strong>Account ID:</strong> {currentUser?.id}</p>
              <p><strong>Access Level:</strong> Standard User Privileges</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
