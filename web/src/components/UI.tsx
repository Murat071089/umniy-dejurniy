import { useState, useEffect } from 'react';
import { Sun, Moon, Calendar, MapPin, Search, BookOpen, User, Mic, Send } from 'lucide-react';

// ==========================================
// GlassCard Component
// ==========================================
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`glass-panel rounded-2xl p-5 border border-borderSoft theme-transition ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ==========================================
// ThemeToggle Component
// ==========================================
interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center w-14 h-7 bg-bgCard rounded-full p-1 cursor-pointer border border-borderSoft focus:outline-none theme-transition"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute w-5 h-5 bg-accentPrimary rounded-full shadow-md transform transition-transform duration-300 ease-out flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3 text-white" fill="white" />
        ) : (
          <Sun className="w-3 h-3 text-white" fill="white" />
        )}
      </div>
      <div className="flex justify-between w-full px-1.5 text-textMuted select-none pointer-events-none">
        <Sun className="w-3.5 h-3.5" />
        <Moon className="w-3.5 h-3.5" />
      </div>
    </button>
  );
};

// ==========================================
// StatusBar Component
// ==========================================
export const StatusBar: React.FC = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-between items-center px-6 py-2 select-none text-[11px] font-semibold text-textSecondary theme-transition">
      <div>{time || '11:30'}</div>
      {/* Dynamic Island style cutout (decorative spacer on absolute center) */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-28 h-6 bg-black rounded-full flex items-center justify-center border border-white/5 shadow-inner">
        <div className="w-3 h-3 bg-neutral-900 rounded-full border border-neutral-800 absolute right-4"></div>
        <div className="text-[9px] text-accentPrimary font-bold flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-accentPrimary rounded-full animate-pulse"></div>
          Дежурный
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Signal Bars */}
        <div className="flex items-end gap-[1.5px] h-2.5">
          <div className="w-[2px] h-1 bg-textSecondary rounded-full"></div>
          <div className="w-[2px] h-1.5 bg-textSecondary rounded-full"></div>
          <div className="w-[2px] h-2 bg-textSecondary rounded-full"></div>
          <div className="w-[2px] h-2.5 bg-textSecondary rounded-full"></div>
        </div>
        <span>5G</span>
        {/* Battery Icon */}
        <div className="w-5 h-2.5 border border-textSecondary/60 rounded-[3px] p-[1px] flex items-center">
          <div className="w-full h-full bg-textSecondary rounded-[1.5px]"></div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// BottomNavigation Component
// ==========================================
export type TabName = 'home' | 'schedule' | 'search' | 'lectures' | 'profile';

interface BottomNavigationProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { name: 'home', icon: Search, label: 'Помощник' },
    { name: 'schedule', icon: Calendar, label: 'Пары' },
    { name: 'search', icon: MapPin, label: 'Где я?' },
    { name: 'lectures', icon: BookOpen, label: 'Лекции' },
    { name: 'profile', icon: User, label: 'Профиль' },
  ] as const;

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[380px] bg-bgCard/90 backdrop-blur-xl border border-borderSoft px-3 py-2.5 rounded-full flex justify-between items-center shadow-lg z-50 theme-transition">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.name;
        return (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full focus:outline-none transition-all duration-300 ${
              isActive 
                ? 'bg-gradient-to-tr from-accentPrimary/25 to-goldSoft/10 border border-accentPrimary/30 text-white shadow-[0_0_12px_rgba(255,106,42,0.25)] scale-110' 
                : 'text-textSecondary hover:text-textPrimary hover:bg-white/5'
            }`}
          >
            <Icon className="w-5 h-5" stroke={isActive ? 'url(#accent-grad)' : 'currentColor'} strokeWidth={isActive ? 2.4 : 2} />
            <span className={`text-[9px] font-medium mt-0.5 ${isActive ? 'hidden' : 'block'}`}>
              {tab.label}
            </span>
            {isActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 bg-accentPrimary rounded-full shadow-[0_0_8px_#FF6A2A]"></span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ==========================================
// PhoneMockup Component
// ==========================================
interface PhoneMockupProps {
  children: React.ReactNode;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ children }) => {
  return (
    <div className="relative w-full max-w-[420px] aspect-[9/19.5] bg-neutral-950 rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-[10px] border-neutral-900 overflow-hidden ring-1 ring-white/10">
      {/* Side buttons */}
      <div className="absolute top-28 -left-[12px] w-[3px] h-10 bg-neutral-800 rounded-r-md"></div>
      <div className="absolute top-44 -left-[12px] w-[3px] h-12 bg-neutral-800 rounded-r-md"></div>
      <div className="absolute top-60 -left-[12px] w-[3px] h-12 bg-neutral-800 rounded-r-md"></div>
      <div className="absolute top-36 -right-[12px] w-[3px] h-16 bg-neutral-800 rounded-l-md"></div>
      
      {/* Internal screen */}
      <div className="relative w-full h-full bg-bgMain rounded-[38px] overflow-hidden flex flex-col theme-transition">
        {children}
      </div>
    </div>
  );
};

// ==========================================
// SearchInput Component
// ==========================================
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSend?: (text: string) => void;
  isLoading?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ onSend, isLoading, className = '', ...props }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && onSend && !isLoading) {
      onSend(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-bgSecondary/60 text-textPrimary placeholder-textMuted border border-borderSoft focus:border-accentPrimary rounded-2xl py-3.5 pl-4 pr-24 outline-none text-sm theme-transition"
        {...props}
      />
      <div className="absolute right-2.5 flex items-center gap-1.5">
        {/* Send Button */}
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-accentPrimary text-white shadow-md glow-orange-soft hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all duration-200"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
};

// ==========================================
// VoiceButton Component
// ==========================================
interface VoiceButtonProps {
  onRecord: () => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onRecord }) => {
  const [isRecording, setIsRecording] = useState(false);

  const handleClick = () => {
    setIsRecording(true);
    onRecord();
    setTimeout(() => setIsRecording(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center w-11 h-11 rounded-2xl border border-borderSoft theme-transition ${
        isRecording 
          ? 'bg-red-500 text-white animate-pulse' 
          : 'bg-bgSecondary/60 text-textPrimary hover:bg-bgCard-hover'
      }`}
      title="Голосовой ввод (симуляция)"
    >
      <Mic className="w-4 h-4" />
    </button>
  );
};

// ==========================================
// QuickActionChip Component
// ==========================================
interface QuickActionChipProps {
  label: string;
  onClick: () => void;
}

export const QuickActionChip: React.FC<QuickActionChipProps> = ({ label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="glass-pill text-textSecondary hover:text-textPrimary px-4 py-2 rounded-full text-xs font-medium theme-transition whitespace-nowrap"
    >
      {label}
    </button>
  );
};

// ==========================================
// LoadingState Component
// ==========================================
export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 p-4 animate-pulse">
      <div className="h-6 bg-white/5 rounded-md w-1/3"></div>
      <div className="h-24 bg-white/5 rounded-2xl w-full"></div>
      <div className="h-16 bg-white/5 rounded-2xl w-full"></div>
    </div>
  );
};

// ==========================================
// SectionHeader Component
// ==========================================
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, actionText, onAction }) => {
  return (
    <div className="flex justify-between items-end mb-4">
      <div>
        <h2 className="text-lg font-bold text-textPrimary tracking-tight theme-transition">{title}</h2>
        {subtitle && <p className="text-[11px] text-textMuted theme-transition mt-0.5">{subtitle}</p>}
      </div>
      {actionText && onAction && (
        <button 
          onClick={onAction} 
          className="text-xs font-semibold text-accentPrimary hover:text-accentSecondary transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// ==========================================
// EmptyState Component
// ==========================================
interface EmptyStateProps {
  message: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, description }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-bgSecondary/20 rounded-2xl border border-dashed border-borderSoft theme-transition">
      <Calendar className="w-8 h-8 text-textMuted mb-2" />
      <span className="text-xs font-semibold text-textSecondary">{message}</span>
      {description && <span className="text-[11px] text-textMuted mt-1">{description}</span>}
    </div>
  );
};

// ==========================================
// Global SVG Gradients Definitions
// ==========================================
export const GlobalSVGDefs: React.FC = () => {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none w-0 h-0" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6A2A" />
          <stop offset="100%" stopColor="#FF9F6A" />
        </linearGradient>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A45C" />
          <stop offset="100%" stopColor="#E5C180" />
        </linearGradient>
        <linearGradient id="danger-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5C5C" />
          <stop offset="100%" stopColor="#FF8E8E" />
        </linearGradient>
        <linearGradient id="success-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#23C46E" />
          <stop offset="100%" stopColor="#5CE598" />
        </linearGradient>
        <linearGradient id="neutral-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A99F97" />
          <stop offset="100%" stopColor="#F4EFEA" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ==========================================
// PremiumIcon Component
// ==========================================
interface PremiumIconProps {
  icon: React.ComponentType<any>;
  className?: string;
  size?: number;
  variant?: 'primary' | 'gold' | 'danger' | 'success' | 'neutral';
}

export const PremiumIcon: React.FC<PremiumIconProps> = ({ 
  icon: Icon, 
  className = '', 
  size = 20, 
  variant = 'primary' 
}) => {
  let gradId = 'accent-grad';
  let containerStyles = 'bg-accentSoft border-accentPrimary/25 text-accentPrimary shadow-[0_0_12px_rgba(255,106,42,0.15)]';
  
  if (variant === 'gold') {
    gradId = 'gold-grad';
    containerStyles = 'bg-amber-500/10 border-amber-500/20 text-[#C9A45C] shadow-[0_0_12px_rgba(201,164,92,0.12)]';
  } else if (variant === 'danger') {
    gradId = 'danger-grad';
    containerStyles = 'bg-red-500/10 border-red-500/20 text-[#FF5C5C] shadow-[0_0_12px_rgba(255,92,92,0.12)]';
  } else if (variant === 'success') {
    gradId = 'success-grad';
    containerStyles = 'bg-green-500/10 border-green-500/20 text-[#23C46E] shadow-[0_0_12px_rgba(35,196,110,0.12)]';
  } else if (variant === 'neutral') {
    gradId = 'neutral-grad';
    containerStyles = 'bg-white/5 border-white/10 text-textSecondary shadow-none';
  }

  return (
    <div className={`relative flex items-center justify-center p-2.5 rounded-xl border backdrop-blur-[4px] transition-all duration-300 hover:scale-105 group-hover:border-accentPrimary/40 ${containerStyles} ${className}`}>
      {/* Inner reflection curve */}
      <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent rounded-t-xl pointer-events-none"></div>
      <Icon 
        size={size} 
        stroke={`url(#${gradId})`} 
        strokeWidth={2.2} 
        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))' }}
        className="relative z-10"
      />
    </div>
  );
};

