import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bot, Key, User as UserIcon } from 'lucide-react';
import Notification from '../components/Notifications';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await login(username, password);
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const fillCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-[100px] animate-pulse-slow"></div>

      <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl z-10 backdrop-blur-md">
        {/* Top header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-brand-primary/15 rounded-2xl flex items-center justify-center text-brand-primary mb-3 border border-brand-primary/20">
            <Bot size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
            RESUME<span className="text-brand-primary">FLOW</span>
          </h2>
          <p className="text-xs text-brand-muted mt-1.5">Recruiting Multi-Agent Platform</p>
        </div>

        {error && (
          <div className="mb-6">
            <Notification message={error} type="error" onClose={() => setError('')} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-xl pl-11 pr-4 py-3 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-xl pl-11 pr-4 py-3 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold rounded-xl py-3 text-sm shadow-lg shadow-brand-primary/25 transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Fast Logins */}
        <div className="mt-8 pt-6 border-t border-brand-border text-center">
          <p className="text-xxs text-brand-muted uppercase tracking-wider font-semibold mb-3">Quick Login (Development Accounts)</p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => fillCredentials('admin', 'admin123')} 
              className="bg-brand-dark border border-brand-border hover:border-brand-primary px-2 py-1.5 rounded-lg text-xxs font-semibold text-brand-muted hover:text-white transition"
            >
              Admin Role
            </button>
            <button 
              onClick={() => fillCredentials('hr', 'hr123')} 
              className="bg-brand-dark border border-brand-border hover:border-brand-primary px-2 py-1.5 rounded-lg text-xxs font-semibold text-brand-muted hover:text-white transition"
            >
              HR Role
            </button>
            <button 
              onClick={() => fillCredentials('reviewer', 'reviewer123')} 
              className="bg-brand-dark border border-brand-border hover:border-brand-primary px-2 py-1.5 rounded-lg text-xxs font-semibold text-brand-muted hover:text-white transition"
            >
              Reviewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
