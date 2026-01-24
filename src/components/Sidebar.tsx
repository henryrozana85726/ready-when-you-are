import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Image as ImageIcon, Video, MessageSquare, User, X, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const navItems = [
  { label: 'Home', path: '/', icon: LayoutDashboard },
  { label: 'Image Generation', path: '/image', icon: ImageIcon },
  { label: 'Video Generation', path: '/video', icon: Video },
  { label: 'AI Assistant', path: '/tools', icon: MessageSquare },
  { label: 'Account', path: '/account', icon: User },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isDark, toggleTheme }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <span className="text-xl font-bold gradient-text">
            BS30 Tools
          </span>
          <button
            onClick={onClose}
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-border space-y-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm font-medium">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground">
              BS
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">User Account</p>
              <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
