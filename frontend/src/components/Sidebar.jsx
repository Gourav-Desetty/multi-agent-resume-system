import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Users, 
  Briefcase, 
  Trophy, 
  Cpu, 
  Mic, 
  FileSpreadsheet, 
  Activity, 
  Settings as SettingsIcon,
  Bot
} from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload Resumes', path: '/upload', icon: UploadCloud },
    { name: 'Candidate Repository', path: '/candidates', icon: Users },
    { name: 'Job Descriptions', path: '/jobs', icon: Briefcase },
    { name: 'Ranking Board', path: '/ranking', icon: Trophy },
    { name: 'Skill Gap Analysis', path: '/gaps', icon: Cpu },
    { name: 'Interview Studio', path: '/interview', icon: Mic },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'System Monitoring', path: '/monitoring', icon: Activity },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-brand-card border-r border-brand-border flex flex-col h-full z-20">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-brand-border space-x-2">
        <Bot className="text-brand-primary" size={24} />
        <span className="text-lg font-bold tracking-tight text-white font-mono">
          RESUME<span className="text-brand-primary">FLOW</span>
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                isActive 
                  ? 'bg-brand-primary/10 text-brand-primary border-l-4 border-brand-primary' 
                  : 'text-brand-muted hover:bg-brand-dark hover:text-brand-text'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Branding info */}
      <div className="p-4 border-t border-brand-border text-center">
        <p className="text-xxs text-brand-muted font-mono">v1.0.0 Screening Suite</p>
      </div>
    </aside>
  );
}
