import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  Volume2,
  ZoomIn,
  User,
  X,
  Sun,
  Moon,
  Settings,
  LogOut,
  LogIn,
  Coins,
  Wrench,
  Rocket,
  Link2,
  FileImage,
  ScanSearch,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isDark, toggleTheme }) => {
  const { user, role, credits, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [toolsOpen, setToolsOpen] = React.useState(
    location.pathname.startsWith('/tools')
  );

  const mainNavItems = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'Image Generation', path: '/image', icon: ImageIcon, requireAuth: true },
    { label: 'Video Generation', path: '/video', icon: Video, requireAuth: true },
    { label: 'Text to Speech', path: '/tts', icon: Volume2, requireAuth: true },
    { label: 'Image Upscaler', path: '/upscaler', icon: ZoomIn, requireAuth: true },
  ];

  const toolsItems = [
    { label: 'Veo Launcher', path: '/tools/veo-launcher', icon: Rocket },
    { label: 'Affiliate Editor', path: '/tools/affiliate-editor', icon: Link2 },
    { label: 'Image Converter', path: '/tools/image-converter', icon: FileImage },
    { label: 'Text to Speech', path: '/tools/text-to-speech', icon: Volume2 },
    { label: 'Image/Video to Prompt', path: '/tools/image-video-to-prompt', icon: ScanSearch },
  ];

  const adminItems = [
    { label: 'Admin Panel', path: '/admin', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    onClose();
  };

  const filteredMainNavItems = mainNavItems.filter(
    (item) => !item.requireAuth || user
  );

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose();
  };

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
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col",
          "lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border shrink-0">
          <span className="text-xl font-bold gradient-text">BS30 Tools</span>
          <button
            onClick={onClose}
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Main Nav Items */}
          {filteredMainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
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

          {/* Tools Section (Collapsible) */}
          {user && (
            <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
              <CollapsibleTrigger className="w-full">
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    location.pathname.startsWith('/tools')
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Wrench size={20} />
                    <span className="font-medium">Tools</span>
                  </div>
                  {toolsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 mt-1 space-y-1">
                {toolsItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )
                    }
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Account */}
          {user && (
            <NavLink
              to="/account"
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <User size={20} />
              <span className="font-medium">Account</span>
            </NavLink>
          )}

          {/* Admin section */}
          {role === 'admin' && (
            <div className="pt-4 border-t border-border mt-4">
              <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Admin
              </p>
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-accent/20 text-accent border border-accent/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3 shrink-0">
          {/* Credits display */}
          {user && (
            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coins size={16} />
                <span className="text-sm">Credits</span>
              </div>
              <span className="font-bold text-foreground">{credits.toLocaleString()}</span>
            </div>
          )}

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

          {/* User Profile / Auth */}
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {role} Plan
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleSignOut}
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              className="w-full gap-2 gradient-brand text-primary-foreground"
              onClick={() => {
                navigate('/auth');
                onClose();
              }}
            >
              <LogIn size={16} />
              Login / Register
            </Button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
