import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Calendar, MapPin, BookOpen, User, 
  Play, ChevronRight, Compass, Shield, Sun, Moon
} from 'lucide-react';
import { 
  StatusBar, BottomNavigation, PhoneMockup, GlassCard,
  SearchInput, VoiceButton, QuickActionChip, LoadingState,
  SectionHeader, EmptyState, PremiumIcon
} from '../components/UI';
import type { TabName } from '../components/UI';

interface WebAppProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const API_BASE = 'http://127.0.0.1:8000/api';

const WebApp: React.FC<WebAppProps> = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [loading, setLoading] = useState(false);
  
  // Profile state
  const [userProfile, setUserProfile] = useState({
    id: 0,
    full_name: 'Артём',
    group_name: 'ИС-21',
    role: 'student',
    location_access: true
  });
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; intent?: string }>>([
    { sender: 'bot', text: 'Привет! Я твой цифровой помощник «Умный дежурный». Можешь спросить меня о расписании, кабинетах, преподавателях или записях лекций.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Schedule state
  const [scheduleDay, setScheduleDay] = useState<'today' | 'tomorrow' | 'week'>('today');
  const [lessons, setLessons] = useState<any[]>([]);
  const [nextLesson, setNextLesson] = useState<any>(null);

  // Search/Buildings state
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [buildingSearch, setBuildingSearch] = useState('');

  // Lectures state
  const [lectureTab, setLectureTab] = useState<'all' | 'missed' | 'favorites'>('all');
  const [lectures, setLectures] = useState<any[]>([]);

  // Group selector modal
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Load profile, buildings, lectures, schedule
  useEffect(() => {
    fetchProfile();
    fetchBuildings();
    fetchLectures();
  }, []);

  // Reload schedule when group or scheduleDay changes
  useEffect(() => {
    fetchSchedule();
  }, [userProfile.group_name, scheduleDay]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile`);
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (e) {
      console.warn("API offline, using mock profile");
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/schedule?group=${userProfile.group_name}&day=${scheduleDay}`);
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
      }
      
      // Fetch next lesson details
      const nextRes = await fetch(`${API_BASE}/schedule?group=${userProfile.group_name}&day=today`);
      if (nextRes.ok) {
        const todayLessons = await nextRes.json();
        const now = new Date();
        const currentStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const upcoming = todayLessons.find((l: any) => l.time_start > currentStr);
        setNextLesson(upcoming || todayLessons[0] || null);
      }
    } catch (e) {
      console.warn("API offline, using mock schedule");
      // Fallback mock schedule
      const mockToday = [
        { id: 1, subject: 'Математический анализ', teacher: 'Иванова Н.А.', building: 3, room: '204', time_start: '09:00', time_end: '10:30' },
        { id: 2, subject: 'Программирование', teacher: 'Ахмедов Р.Т.', building: 3, room: '305', time_start: '10:45', time_end: '12:15' },
        { id: 3, subject: 'Английский язык', teacher: 'Соколова М.И.', building: 1, room: '118', time_start: '13:00', time_end: '14:30' },
      ];
      const mockTomorrow = [
        { id: 4, subject: 'История', teacher: 'Петров С.К.', building: 1, room: '110', time_start: '09:00', time_end: '10:30' },
        { id: 5, subject: 'Базы данных', teacher: 'Орлова Е.В.', building: 3, room: '307', time_start: '10:45', time_end: '12:15' },
        { id: 6, subject: 'Физическая культура', teacher: '—', building: null, room: 'спортзал', time_start: '13:00', time_end: '14:30' },
      ];
      setLessons(scheduleDay === 'today' ? mockToday : (scheduleDay === 'tomorrow' ? mockTomorrow : [...mockToday, ...mockTomorrow]));
      setNextLesson(mockToday[0]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await fetch(`${API_BASE}/buildings`);
      if (res.ok) {
        const data = await res.json();
        setBuildings(data);
      }
    } catch (e) {
      const mockBuildings = [
        { id: 1, number: 1, name: 'Главный корпус', address: 'ул. Ленина, 1', description: 'Главный учебный корпус, рядом деканат и актовый зал. Здесь находится приёмная комиссия, бухгалтерия и столовая.', map_url: 'https://yandex.ru/maps/?text=ул.+Ленина+1' },
        { id: 2, number: 3, name: 'Корпус информационных систем', address: 'ул. Ленина, 14', description: 'Здесь проходят пары по программированию, математике и базам данных. От главного корпуса пешком около 4 минут.', map_url: 'https://yandex.ru/maps/?text=ул.+Ленина+14' },
        { id: 3, number: 5, name: 'Лабораторный корпус', address: 'ул. Университетская, 7', description: 'Корпус с лабораториями, компьютерными классами и кафедрой физики. Рядом с главным входом со стороны улицы Ленина.', map_url: 'https://yandex.ru/maps/?text=ул.+Университетская+7' }
      ];
      setBuildings(mockBuildings);
    }
  };

  const fetchLectures = async () => {
    try {
      const res = await fetch(`${API_BASE}/lectures`);
      if (res.ok) {
        const data = await res.json();
        setLectures(data);
      }
    } catch (e) {
      const mockLectures = [
        { id: 1, subject: 'История', title: 'Российская империя в XIX веке', date: '2026-05-12', teacher: 'Петров С.К.', url: 'https://example.com/lectures/history-19-century' },
        { id: 2, subject: 'Математический анализ', title: 'Производные и пределы', date: '2026-05-10', teacher: 'Иванова Н.А.', url: 'https://example.com/lectures/math-derivatives' },
        { id: 3, subject: 'Базы данных', title: 'Введение в SQL', date: '2026-05-15', teacher: 'Орлова Е.В.', url: 'https://example.com/lectures/sql-intro' }
      ];
      setLectures(mockLectures);
    }
  };

  // User queries assistant
  const handleSendQuery = async (text: string) => {
    if (!text.trim() || isTyping) return;

    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, group: userProfile.group_name })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'bot', text: data.answer, intent: data.intent }]);
      } else {
        throw new Error();
      }
    } catch (e) {
      // Mock local replies if offline
      setTimeout(() => {
        let answer = "Я временно оффлайн, но вот сохраненный ответ: ";
        const normalized = text.toLowerCase();
        
        if (normalized.includes('5 корпус') || normalized.includes('5 корпуст')) {
          answer += "🏫 5 корпус — лабораторный корпус (ул. Университетская, 7). Пешком от главного корпуса — примерно 6 минут.";
        } else if (normalized.includes('матан') || normalized.includes('матав') || normalized.includes('математик')) {
          answer += "👨‍🏫 Математический анализ у группы ИС-21 ведёт Иванова Наталья Александровна.";
        } else if (normalized.includes('расписани') || normalized.includes('распасани') || normalized.includes('пары')) {
          answer += "📅 Расписание доступно во вкладке 'Пары'. Завтра у вас История, Базы данных и Физкультура.";
        } else if (normalized.includes('петя') || normalized.includes('иванов')) {
          answer += "📍 Петя Иванов сейчас находится в 3 корпусе, аудитория 205 (Компьютерный класс).";
        } else if (normalized.includes('анна') || normalized.includes('смирнова')) {
          answer += "📍 Анна Смирнова не открыла доступ к геолокации. Я не могу показывать её местоположение без разрешения.";
        } else if (normalized.includes('лекци') || normalized.includes('истори')) {
          answer += "📚 Запись лекции по Истории доступна во вкладке 'Лекции'. Тема: «Российская империя в XIX веке».";
        } else {
          answer += "Извините, не удалось распознать запрос. Попробуйте написать 'где 5 корпус?' или 'кто ведет матан?'";
        }
        setChatMessages(prev => [...prev, { sender: 'bot', text: answer }]);
      }, 800);
    } finally {
      setIsTyping(false);
    }
  };

  // Voice recording simulation
  const handleVoiceRecord = () => {
    const voiceQueries = [
      "Где 5 корпус?",
      "Кто ведёт матан?",
      "Расписание на завтра",
      "Где сейчас Петя Иванов?",
      "Есть запись лекции по истории?"
    ];
    const randomQuery = voiceQueries[Math.floor(Math.random() * voiceQueries.length)];
    
    // Simulate speech to text insertion
    setTimeout(() => {
      handleSendQuery(randomQuery);
    }, 1500);
  };

  // Toggle Location in profile
  const handleToggleLocation = async (enabled: boolean) => {
    setUserProfile(prev => ({ ...prev, location_access: enabled }));
    try {
      await fetch(`${API_BASE}/profile/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
    } catch (e) {
      console.warn("API offline");
    }
  };

  // Update Group
  const handleSetGroup = async (group: string) => {
    setUserProfile(prev => ({ ...prev, group_name: group }));
    setShowGroupModal(false);
    try {
      await fetch(`${API_BASE}/profile/group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: group })
      });
    } catch (e) {
      console.warn("API offline");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-0 md:p-6 ${theme === 'dark' ? 'bg-glow-dark' : 'bg-glow-light'} theme-transition`}>
      <div className="noise-overlay"></div>
      
      {/* Phone container mockup on desktop, fullscreen on mobile */}
      <div className="w-full h-screen md:h-auto md:w-auto flex flex-col items-center justify-center">
        
        {/* Navigation back to landing on top of mockup */}
        <div className="hidden md:flex justify-between items-center w-full max-w-[420px] mb-3 px-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 text-xs text-textSecondary hover:text-textPrimary font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            На лендинг
          </button>
          <div className="text-xs text-textMuted font-bold tracking-widest">WEB APP DEMO</div>
        </div>

        <PhoneMockup>
          {/* HEADER / STATUS BAR */}
          <StatusBar />
          
          {/* SCREEN BODY */}
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-28 text-left scrollbar-thin">
            
            {/* 1. HOME SCREEN */}
            {activeTab === 'home' && (
              <div className="flex flex-col gap-5">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-extrabold text-textPrimary tracking-tight">Умный дежурный</h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-textSecondary font-semibold">помощник online</span>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-bgSecondary/60 border border-borderSoft text-textSecondary hover:text-textPrimary theme-transition"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>

                {/* Main Scan-lookalike dialogue card */}
                <GlassCard className="relative overflow-hidden border-accentPrimary/20 p-6 flex flex-col gap-4">
                  {/* Decorative corner borders mimicking scanner frame */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-accentPrimary"></div>
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-accentPrimary"></div>
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-accentPrimary"></div>
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-accentPrimary"></div>
                  
                  <div>
                    <h3 className="font-bold text-lg text-textPrimary tracking-tight">Спроси дежурного</h3>
                    <p className="text-[11px] text-textMuted mt-1">Расписание, корпуса, лекции и преподаватели — в одном месте.</p>
                  </div>

                  {/* Chat input box */}
                  <div className="flex gap-2 items-center">
                    <SearchInput 
                      placeholder="Например: где 5 корпус?" 
                      onSend={handleSendQuery}
                      isLoading={isTyping}
                      className="flex-1"
                    />
                    <VoiceButton onRecord={handleVoiceRecord} />
                  </div>
                </GlassCard>

                {/* Quick query chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
                  <QuickActionChip label="Пары на завтра" onClick={() => handleSendQuery('Расписание на завтра')} />
                  <QuickActionChip label="Где 5 корпус?" onClick={() => handleSendQuery('Где 5 корпус?')} />
                  <QuickActionChip label="Кто ведет матан?" onClick={() => handleSendQuery('Кто ведёт матан?')} />
                  <QuickActionChip label="Запись лекции" onClick={() => handleSendQuery('Есть запись лекции по истории?')} />
                </div>

                {/* Dialog Response Display */}
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] text-textMuted font-bold tracking-wider uppercase">Диалог с ботом</div>
                  <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                    {chatMessages.slice(-2).map((msg, index) => (
                      <div 
                        key={index}
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-accentPrimary text-white self-end ml-12 shadow-sm'
                            : 'bg-bgCard border border-borderSoft text-textSecondary self-start mr-12 whitespace-pre-line theme-transition'
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="bg-bgCard border border-borderSoft text-textMuted mr-12 p-3 rounded-2xl text-xs flex items-center gap-1 self-start">
                        <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce delay-200"></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Access Menu Grid */}
                <div>
                  <SectionHeader title="Быстрый доступ" />
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setActiveTab('schedule')}
                      className="p-4 bg-bgCard border border-borderSoft rounded-2xl flex flex-col gap-2.5 hover:bg-bgCard-hover text-left theme-transition focus:outline-none group"
                    >
                      <PremiumIcon icon={Calendar} variant="primary" size={18} className="w-9 h-9 p-0" />
                      <div>
                        <span className="font-bold text-xs text-textPrimary block">Расписание</span>
                        <span className="text-[9px] text-textMuted block mt-0.5">Пары на сегодня/завтра</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('search')}
                      className="p-4 bg-bgCard border border-borderSoft rounded-2xl flex flex-col gap-2.5 hover:bg-bgCard-hover text-left theme-transition focus:outline-none group"
                    >
                      <PremiumIcon icon={MapPin} variant="gold" size={18} className="w-9 h-9 p-0" />
                      <div>
                        <span className="font-bold text-xs text-textPrimary block">Корпуса</span>
                        <span className="text-[9px] text-textMuted block mt-0.5">Схема прохода и карта</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleSendQuery('Кто преподаватели')}
                      className="p-4 bg-bgCard border border-borderSoft rounded-2xl flex flex-col gap-2.5 hover:bg-bgCard-hover text-left theme-transition focus:outline-none group"
                    >
                      <PremiumIcon icon={User} variant="primary" size={18} className="w-9 h-9 p-0" />
                      <div>
                        <span className="font-bold text-xs text-textPrimary block">Преподаватели</span>
                        <span className="text-[9px] text-textMuted block mt-0.5">Контакты и кафедры</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('lectures')}
                      className="p-4 bg-bgCard border border-borderSoft rounded-2xl flex flex-col gap-2.5 hover:bg-bgCard-hover text-left theme-transition focus:outline-none group"
                    >
                      <PremiumIcon icon={BookOpen} variant="gold" size={18} className="w-9 h-9 p-0" />
                      <div>
                        <span className="font-bold text-xs text-textPrimary block">Лекции</span>
                        <span className="text-[9px] text-textMuted block mt-0.5">Видеозаписи лекций</span>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* 2. SCHEDULE SCREEN */}
            {activeTab === 'schedule' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-extrabold text-textPrimary tracking-tight">Расписание</h1>
                    <p className="text-[10px] text-textMuted font-semibold mt-0.5">Группа {userProfile.group_name}</p>
                  </div>
                  <button 
                    onClick={() => setShowGroupModal(true)} 
                    className="px-3 py-1.5 bg-bgSecondary/60 border border-borderSoft text-[10px] font-bold text-accentPrimary rounded-full hover:bg-bgCard-hover transition-colors"
                  >
                    Сменить группу
                  </button>
                </div>

                {/* Upper Next Lesson info */}
                {nextLesson && (
                  <GlassCard className="bg-gradient-to-r from-accentPrimary/10 to-goldSoft/10 border-accentPrimary/20 p-4">
                    <div className="text-[10px] text-accentPrimary font-bold uppercase tracking-wider">Следующая пара</div>
                    <h4 className="font-bold text-sm text-textPrimary mt-1.5">{nextLesson.subject}</h4>
                    <div className="text-xs font-semibold text-textSecondary mt-1">{nextLesson.time_start}–{nextLesson.time_end}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-textMuted mt-2">
                      <MapPin className="w-3.5 h-3.5 text-accentSecondary" />
                      <span>{nextLesson.building ? `${nextLesson.building} корпус` : '—'} · ауд. {nextLesson.room}</span>
                    </div>
                  </GlassCard>
                )}

                {/* Tabs Day filters */}
                <div className="flex gap-2 p-1 bg-bgSecondary/60 border border-borderSoft rounded-2xl theme-transition select-none">
                  {(['today', 'tomorrow', 'week'] as const).map((day) => (
                    <button
                      key={day}
                      onClick={() => setScheduleDay(day)}
                      className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all duration-300 ${
                        scheduleDay === day 
                          ? 'bg-accentPrimary text-white shadow-md' 
                          : 'text-textSecondary hover:text-textPrimary'
                      }`}
                    >
                      {day === 'today' ? 'Сегодня' : (day === 'tomorrow' ? 'Завтра' : 'Неделя')}
                    </button>
                  ))}
                </div>

                {/* Lessons list in transaction style */}
                {loading ? (
                  <LoadingState />
                ) : lessons.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {lessons.map((les, index) => {
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      let status = 'Скоро';
                      let statusColor = 'bg-accentSoft text-accentPrimary border border-accentPrimary/25';
                      
                      if (timeStr >= les.time_start && timeStr <= les.time_end) {
                        status = 'Идёт';
                        statusColor = 'bg-green-500/10 text-success border border-success/20';
                      } else if (timeStr > les.time_end) {
                        status = 'Завершено';
                        statusColor = 'bg-white/5 text-textMuted border border-borderSoft';
                      }

                      return (
                        <div 
                          key={les.id || index}
                          className="flex items-center justify-between p-3.5 bg-bgCard hover:bg-bgCard-hover border border-borderSoft rounded-2xl theme-transition text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accentPrimary/20 to-goldSoft/10 border border-accentPrimary/20 flex items-center justify-center text-accentPrimary font-extrabold text-xs flex-shrink-0 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                              {les.subject.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-textPrimary leading-snug">{les.subject}</h5>
                              <p className="text-[10px] text-textMuted mt-0.5">{les.teacher}</p>
                              <p className="text-[9px] text-textMuted mt-0.5">
                                {les.building ? `${les.building} корпус, ` : ''}ауд. {les.room}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold text-textPrimary">{les.time_start}</span>
                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColor}`}>
                              {status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState message="Пар не найдено" description="Возможно сегодня выходной или пары ещё не внесены." />
                )}
              </div>
            )}

            {/* 3. SEARCH SCREEN */}
            {activeTab === 'search' && (
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-xl font-extrabold text-textPrimary tracking-tight">Найти место</h1>
                  <p className="text-[10px] text-textMuted mt-0.5">Карта корпусов, аудиторий и деканатов</p>
                </div>

                {/* Building search bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={buildingSearch}
                    onChange={(e) => setBuildingSearch(e.target.value)}
                    placeholder="Корпус, библиотека, столовая..."
                    className="w-full bg-bgSecondary/60 text-textPrimary placeholder-textMuted border border-borderSoft focus:border-accentPrimary rounded-2xl py-3 pl-4 pr-10 outline-none text-xs theme-transition"
                  />
                  <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-textMuted" />
                </div>

                {/* Selected Building Detail overlay/card */}
                {selectedBuilding ? (
                  <GlassCard className="flex flex-col gap-4 border-accentPrimary/20 text-left p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] text-accentPrimary font-bold uppercase tracking-wider">Информация о корпусе</span>
                        <h4 className="font-bold text-base text-textPrimary mt-1">{selectedBuilding.number} корпус</h4>
                        <p className="text-xs text-textSecondary">{selectedBuilding.name}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedBuilding(null)}
                        className="text-[10px] text-textMuted hover:text-textPrimary"
                      >
                        Назад
                      </button>
                    </div>
                    <p className="text-[11px] text-textSecondary leading-relaxed">{selectedBuilding.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-textMuted border-t border-borderSoft pt-3">
                      <MapPin className="w-4 h-4 text-accentPrimary" />
                      <span>{selectedBuilding.address}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <a 
                        href={selectedBuilding.map_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 text-center py-2.5 bg-accentPrimary hover:bg-accentSecondary text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        Открыть карту
                      </a>
                    </div>
                  </GlassCard>
                ) : (
                  // Locations List
                  <div className="flex flex-col gap-3">
                    {buildings
                      .filter(b => b.name.toLowerCase().includes(buildingSearch.toLowerCase()) || `${b.number}`.includes(buildingSearch))
                      .map((b) => (
                        <div 
                          key={b.id}
                          onClick={() => setSelectedBuilding(b)}
                          className="flex items-center justify-between p-3.5 bg-bgCard hover:bg-bgCard-hover border border-borderSoft rounded-2xl theme-transition cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3">
                            <PremiumIcon icon={MapPin} variant="gold" size={16} className="w-10 h-10 p-0 flex-shrink-0" />
                            <div>
                              <h5 className="font-bold text-xs text-textPrimary">{b.number} корпус — {b.name}</h5>
                              <p className="text-[10px] text-textMuted mt-0.5">{b.address}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-textMuted" />
                        </div>
                      ))}
                      
                    {/* Add visual elements for static locations */}
                    <div className="text-[10px] text-textMuted font-bold tracking-wider uppercase mt-2">Популярные места</div>
                    {[
                      { name: 'Библиотека', desc: 'Главный корпус, 2 этаж', walk: '1 минута от главного входа' },
                      { name: 'Столовая', desc: 'Главный корпус, цокольный этаж', walk: '1 минута от входа' },
                      { name: 'Спортзал', desc: 'Отдельный комплекс', walk: '3 минуты во внутреннем дворе' }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSendQuery(`где ${item.name}`)}
                        className="flex items-center justify-between p-3.5 bg-bgCard hover:bg-bgCard-hover border border-borderSoft rounded-2xl theme-transition cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <PremiumIcon icon={Compass} variant="neutral" size={16} className="w-10 h-10 p-0 flex-shrink-0" />
                          <div>
                            <h5 className="font-bold text-xs text-textPrimary">{item.name}</h5>
                            <p className="text-[10px] text-textMuted mt-0.5">{item.desc} · {item.walk}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-textMuted" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. LECTURES SCREEN */}
            {activeTab === 'lectures' && (
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-xl font-extrabold text-textPrimary tracking-tight">Записи лекций</h1>
                  <p className="text-[10px] text-textMuted mt-0.5">Видео и конспекты пропущенных пар</p>
                </div>

                {/* Tabs filters */}
                <div className="flex gap-2 p-1 bg-bgSecondary/60 border border-borderSoft rounded-2xl theme-transition select-none">
                  {(['all', 'missed', 'favorites'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setLectureTab(tab)}
                      className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all duration-300 ${
                        lectureTab === tab 
                          ? 'bg-accentPrimary text-white shadow-md' 
                          : 'text-textSecondary hover:text-textPrimary'
                      }`}
                    >
                      {tab === 'all' ? 'Все' : (tab === 'missed' ? 'Пропущенные' : 'Избранные')}
                    </button>
                  ))}
                </div>

                {/* Lecture list */}
                <div className="flex flex-col gap-3">
                  {lectures
                    .filter(lec => lectureTab === 'all' || (lectureTab === 'missed' && lec.id === 2) || (lectureTab === 'favorites' && lec.id === 3))
                    .map((lec) => (
                      <div 
                        key={lec.id}
                        className="p-4 bg-bgCard border border-borderSoft rounded-2xl flex flex-col gap-3 hover:bg-bgCard-hover theme-transition text-left"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] px-2 py-0.5 bg-accentSoft text-accentPrimary rounded-full font-bold uppercase tracking-wider">
                              Запись
                            </span>
                            <h4 className="font-bold text-xs text-textPrimary mt-1.5 leading-snug">{lec.subject}</h4>
                            <p className="text-[10px] text-textSecondary font-medium mt-0.5">{lec.title}</p>
                          </div>
                          <span className="text-[9px] text-textMuted font-bold">{lec.date}</span>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-borderSoft pt-3 mt-1 text-[10px]">
                          <span className="text-textMuted">Лектор: {lec.teacher}</span>
                          <a 
                            href={lec.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-accentPrimary hover:bg-accentSecondary text-white font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            Смотреть
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 5. PROFILE SCREEN */}
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="text-xl font-extrabold text-textPrimary tracking-tight">Профиль</h1>
                  <p className="text-[10px] text-textMuted mt-0.5">Настройки аккаунта студента</p>
                </div>

                {/* User avatar and name card */}
                <GlassCard className="flex items-center gap-4 text-left p-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-accentPrimary to-goldSoft p-1 flex-shrink-0">
                    <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {userProfile.full_name.slice(0, 1)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-textPrimary leading-none">{userProfile.full_name}</h3>
                    <p className="text-[10px] text-textMuted mt-1">{userProfile.role === 'student' ? 'Студент' : 'Администратор'}</p>
                    <div className="inline-block mt-2 px-2.5 py-0.5 bg-white/5 border border-borderSoft rounded-full text-[9px] font-bold text-accentPrimary tracking-wide uppercase">
                      Группа: {userProfile.group_name}
                    </div>
                  </div>
                </GlassCard>

                {/* Geolocation permit card */}
                <GlassCard className="flex flex-col gap-3 text-left p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accentPrimary" />
                      <span className="font-bold text-xs text-textPrimary">Геолокация</span>
                    </div>
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => handleToggleLocation(!userProfile.location_access)}
                      className={`relative w-10 h-6 rounded-full p-0.5 flex items-center transition-colors focus:outline-none ${
                        userProfile.location_access ? 'bg-success' : 'bg-bgSecondary'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        userProfile.location_access ? 'translate-x-4' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>
                  <p className="text-[10px] text-textMuted leading-relaxed">
                    Твою локацию увидят только те одногруппники, которым ты разрешишь доступ. Локация отслеживается внутри корпусов.
                  </p>
                </GlassCard>

                {/* Custom Action settings buttons list */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setShowGroupModal(true)}
                    className="flex justify-between items-center p-4 bg-bgCard hover:bg-bgCard-hover border border-borderSoft rounded-2xl theme-transition focus:outline-none text-left text-xs font-semibold text-textPrimary"
                  >
                    <span>Изменить группу</span>
                    <div className="flex items-center gap-1.5 text-textMuted">
                      <span>{userProfile.group_name}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>

                  <button 
                    onClick={toggleTheme}
                    className="flex justify-between items-center p-4 bg-bgCard hover:bg-bgCard-hover border border-borderSoft rounded-2xl theme-transition focus:outline-none text-left text-xs font-semibold text-textPrimary"
                  >
                    <span>Тема интерфейса</span>
                    <div className="flex items-center gap-1.5 text-textMuted">
                      <span>{theme === 'dark' ? 'Тёмная' : 'Светлая'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>

                  <button 
                    onClick={() => navigate('/admin')}
                    className="flex justify-between items-center p-4 bg-bgCard hover:bg-bgCard-hover border border-borderSoft rounded-2xl theme-transition focus:outline-none text-left text-xs font-semibold text-textPrimary"
                  >
                    <span>Панель администратора</span>
                    <ChevronRight className="w-4 h-4 text-textMuted" />
                  </button>

                  <button 
                    onClick={() => navigate('/')}
                    className="flex justify-between items-center p-4 bg-bgCard hover:bg-bgCard-hover border border-borderSoft rounded-2xl theme-transition focus:outline-none text-left text-xs font-semibold text-red-500"
                  >
                    <span>Выйти из сессии</span>
                    <ChevronRight className="w-4 h-4 text-textMuted" />
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* BOTTOM FLOATING NAV BAR */}
          <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </PhoneMockup>
      </div>

      {/* GROUP CHOICE MODAL */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-xs flex flex-col gap-4 text-left border-accentPrimary/20 p-6">
            <h4 className="font-bold text-sm text-textPrimary">Выбери учебную группу</h4>
            <div className="flex flex-col gap-2 mt-2">
              {['ИС-21', 'ЭК-11', 'ЮР-32'].map((group) => (
                <button
                  key={group}
                  onClick={() => handleSetGroup(group)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    userProfile.group_name === group
                      ? 'bg-accentPrimary text-white shadow-md'
                      : 'bg-bgSecondary/60 hover:bg-bgCard-hover border border-borderSoft text-textSecondary'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowGroupModal(false)}
              className="text-xs text-textMuted text-center hover:text-textPrimary mt-3 focus:outline-none"
            >
              Отмена
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default WebApp;
