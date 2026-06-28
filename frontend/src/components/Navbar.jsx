import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Bell } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-brand-border bg-brand-card flex items-center justify-between px-6 z-10">
      <div className="flex items-center space-x-3">
        <span className="text-brand-muted text-sm">Workspace:</span>
        <span className="bg-brand-dark px-2 py-0.5 rounded text-xs text-brand-primary border border-brand-border font-mono font-semibold">
          Active Recruitment
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Mock Notification bell */}
        <button className="p-1.5 rounded-full hover:bg-brand-dark text-brand-muted hover:text-brand-text transition relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-accent rounded-full"></span>
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3 pl-2 border-l border-brand-border">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-medium text-brand-text">{user.username}</span>
              <span className="text-xxs text-brand-muted capitalize font-semibold">{user.role}</span>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 border border-brand-primary flex items-center justify-center text-brand-primary font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>

            <button 
              onClick={logout}
              title="Logout" 
              className="p-1.5 rounded-full hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
