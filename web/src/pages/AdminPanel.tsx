import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Key, 
  Calendar, MapPin, User, BookOpen, Users, LogOut, X
} from 'lucide-react';
import { ThemeToggle, GlassCard } from '../components/UI';

interface AdminPanelProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const API_BASE = 'http://127.0.0.1:8000/api';

const AdminPanel: React.FC<AdminPanelProps> = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active admin tab
  const [adminTab, setAdminTab] = useState<'schedule' | 'buildings' | 'teachers' | 'lectures' | 'students'>('schedule');

  // Data lists
  const [summary, setSummary] = useState<any>({ schedule: 0, buildings: 0, teachers: 0, lecture_records: 0, users: 0 });
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit / Add modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null); // null if adding new

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    group_name: 'ИС-21',
    date: new Date().toISOString().split('T')[0],
    time_start: '09:00',
    time_end: '10:30',
    subject_name: '',
    teacher_name: '',
    building_number: '1',
    room_number: ''
  });

  const [buildingForm, setBuildingForm] = useState({
    number: '',
    name: '',
    address: '',
    description: '',
    map_url: ''
  });

  const [teacherForm, setTeacherForm] = useState({
    full_name: '',
    short_name: '',
    department: ''
  });

  const [lectureForm, setLectureForm] = useState({
    subject_name: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    teacher_name: '',
    url: ''
  });

  // Load summary and database tables when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary();
      fetchTableData();
    }
  }, [isAuthenticated, adminTab]);

  const getAuthHeader = () => {
    return { 'Authorization': 'Basic ' + btoa(`${username}:${password}`) };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/admin/summary`, {
        headers: { 'Authorization': 'Basic ' + btoa(`${username}:${password}`) }
      });
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setLoginError('Неверный логин или пароль');
      }
    } catch (e) {
      // Fallback local mock auth if API is offline
      if (username === 'admin' && password === 'admin123') {
        setIsAuthenticated(true);
      } else {
        setLoginError('Неверный логин или пароль (локально)');
      }
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/summary`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.warn("API offline");
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (adminTab === 'schedule') endpoint = 'admin/schedule';
      else if (adminTab === 'buildings') endpoint = 'buildings';
      else if (adminTab === 'teachers') endpoint = 'teachers';
      else if (adminTab === 'lectures') endpoint = 'lectures';
      else if (adminTab === 'students') endpoint = 'students';

      const res = await fetch(`${API_BASE}/${endpoint}`, {
        headers: adminTab === 'schedule' ? getAuthHeader() : {}
      });
      
      if (res.ok) {
        const data = await res.json();
        setDataList(data);
      }
    } catch (e) {
      console.warn("API offline, using mock list");
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот элемент?')) return;
    try {
      let endpoint = '';
      if (adminTab === 'schedule') endpoint = 'admin/schedule';
      else if (adminTab === 'buildings') endpoint = 'admin/buildings';
      else if (adminTab === 'teachers') endpoint = 'admin/teachers';
      else if (adminTab === 'lectures') endpoint = 'admin/lectures';

      const res = await fetch(`${API_BASE}/${endpoint}/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        fetchTableData();
        fetchSummary();
      }
    } catch (e) {
      alert('Ошибка при удалении с сервера (API offline)');
    }
  };

  const handleOpenForm = (item: any = null) => {
    setCurrentItem(item);
    if (item) {
      if (adminTab === 'schedule') {
        setScheduleForm({
          group_name: item.group_name || 'ИС-21',
          date: item.date || '',
          time_start: item.time_start || '09:00',
          time_end: item.time_end || '10:30',
          subject_name: item.subject_name || '',
          teacher_name: item.teacher_name || '',
          building_number: `${item.building_number || '1'}`,
          room_number: item.room_number || ''
        });
      } else if (adminTab === 'buildings') {
        setBuildingForm({
          number: `${item.number || ''}`,
          name: item.name || '',
          address: item.address || '',
          description: item.description || '',
          map_url: item.map_url || ''
        });
      } else if (adminTab === 'teachers') {
        setTeacherForm({
          full_name: item.full_name || '',
          short_name: item.short_name || '',
          department: item.department || ''
        });
      } else if (adminTab === 'lectures') {
        setLectureForm({
          subject_name: item.subject || item.subject_name || '',
          title: item.title || '',
          date: item.date || '',
          teacher_name: item.teacher || item.teacher_name || '',
          url: item.url || ''
        });
      }
    } else {
      // Clear forms
      const today = new Date().toISOString().split('T')[0];
      setScheduleForm({ group_name: 'ИС-21', date: today, time_start: '09:00', time_end: '10:30', subject_name: '', teacher_name: '', building_number: '1', room_number: '' });
      setBuildingForm({ number: '', name: '', address: '', description: '', map_url: '' });
      setTeacherForm({ full_name: '', short_name: '', department: '' });
      setLectureForm({ subject_name: '', title: '', date: today, teacher_name: '', url: '' });
    }
    setShowFormModal(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let endpoint = '';
      let payload: any = {};

      if (adminTab === 'schedule') {
        endpoint = 'admin/schedule';
        payload = { ...scheduleForm, building_number: parseInt(scheduleForm.building_number) };
      } else if (adminTab === 'buildings') {
        endpoint = 'admin/buildings';
        payload = { ...buildingForm, number: parseInt(buildingForm.number) };
      } else if (adminTab === 'teachers') {
        endpoint = 'admin/teachers';
        payload = teacherForm;
      } else if (adminTab === 'lectures') {
        endpoint = 'admin/lectures';
        payload = lectureForm;
      }

      const url = currentItem 
        ? `${API_BASE}/${endpoint}/${currentItem.id}` 
        : `${API_BASE}/${endpoint}`;
      
      const res = await fetch(url, {
        method: currentItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowFormModal(false);
        fetchTableData();
        fetchSummary();
      } else {
        alert('Ошибка при сохранении данных.');
      }
    } catch (e) {
      alert('Ошибка API бэкенда (API offline)');
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden theme-transition ${theme === 'dark' ? 'bg-glow-dark' : 'bg-glow-light'}`}>
      <div className="noise-overlay"></div>
      
      {/* 1. AUTHENTICATION SCREEN */}
      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <GlassCard className="w-full max-w-sm flex flex-col gap-5 text-left relative p-8">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accentPrimary flex items-center justify-center shadow">
                  <Key className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-extrabold text-lg text-textPrimary">Админ-панель</h2>
              </div>
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Логин</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-bgSecondary/60 text-textPrimary border border-borderSoft focus:border-accentPrimary rounded-xl py-2.5 px-3.5 outline-none text-xs theme-transition mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-textSecondary uppercase tracking-wider">Пароль</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bgSecondary/60 text-textPrimary border border-borderSoft focus:border-accentPrimary rounded-xl py-2.5 px-3.5 outline-none text-xs theme-transition mt-1"
                />
              </div>

              {loginError && <p className="text-xs text-error font-semibold">{loginError}</p>}

              <button
                type="submit"
                className="w-full py-3 bg-accentPrimary hover:bg-accentSecondary text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md glow-orange-soft"
              >
                Войти в панель
              </button>
            </form>
            <button 
              onClick={() => navigate('/app')}
              className="text-xs text-textMuted text-center hover:text-textPrimary flex items-center justify-center gap-1 mt-2 focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Вернуться в демо
            </button>
          </GlassCard>
        </div>
      ) : (
        
        // 2. MAIN ADMIN DASHBOARD
        <div className="relative max-w-7xl mx-auto px-6 py-8 z-10 text-left">
          
          {/* Header controls */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/app')}
                className="p-2.5 rounded-xl bg-bgCard border border-borderSoft text-textSecondary hover:text-textPrimary transition-colors"
                title="В приложение"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-textPrimary tracking-tight">Панель управления</h1>
                <p className="text-[10px] text-textMuted mt-0.5">Управление данными Telegram-бота и Web App</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats overview boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Пары', icon: Calendar, value: summary.schedule || dataList.length || 0, tab: 'schedule' },
              { label: 'Корпуса', icon: MapPin, value: summary.buildings || 0, tab: 'buildings' },
              { label: 'Преподы', icon: User, value: summary.teachers || 0, tab: 'teachers' },
              { label: 'Лекции', icon: BookOpen, value: summary.lecture_records || 0, tab: 'lectures' },
              { label: 'Студенты', icon: Users, value: summary.users || 0, tab: 'students' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              const isActive = adminTab === stat.tab;
              return (
                <GlassCard 
                  key={idx} 
                  onClick={() => setAdminTab(stat.tab as any)}
                  className={`p-4 flex items-center justify-between cursor-pointer hover:border-accentPrimary transition-all ${
                    isActive ? 'border-accentPrimary/50 bg-accentSoft' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-textSecondary font-bold">{stat.label}</span>
                    <span className="text-xl font-black text-textPrimary mt-1">{stat.value}</span>
                  </div>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-accentPrimary' : 'text-textMuted'}`} />
                </GlassCard>
              );
            })}
          </div>

          {/* Table list panel */}
          <GlassCard className="flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-borderSoft">
              <div className="font-bold text-sm text-textPrimary uppercase tracking-wider">
                {adminTab === 'schedule' && 'Расписание учебных пар'}
                {adminTab === 'buildings' && 'Корпуса университета'}
                {adminTab === 'teachers' && 'Преподавательский состав'}
                {adminTab === 'lectures' && 'Архив записей лекций'}
                {adminTab === 'students' && 'Студенты и Геолокация'}
              </div>
              {adminTab !== 'students' && (
                <button
                  onClick={() => handleOpenForm()}
                  className="px-4 py-2 bg-accentPrimary hover:bg-accentSecondary text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </button>
              )}
            </div>

            {/* Grid/Table lists */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-xs text-textMuted">Загрузка данных из БД...</div>
              ) : dataList.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-bgSecondary/40 border-b border-borderSoft text-textSecondary font-bold">
                      {adminTab === 'schedule' && (
                        <>
                          <th className="p-4">Группа</th>
                          <th className="p-4">Предмет</th>
                          <th className="p-4">Преподаватель</th>
                          <th className="p-4">Время</th>
                          <th className="p-4">Корпус/Ауд</th>
                          <th className="p-4">Дата</th>
                        </>
                      )}
                      {adminTab === 'buildings' && (
                        <>
                          <th className="p-4">Корпус</th>
                          <th className="p-4">Название</th>
                          <th className="p-4">Адрес</th>
                          <th className="p-4">Описание</th>
                        </>
                      )}
                      {adminTab === 'teachers' && (
                        <>
                          <th className="p-4">ФИО Преподавателя</th>
                          <th className="p-4">Кратко</th>
                          <th className="p-4">Кафедра</th>
                        </>
                      )}
                      {adminTab === 'lectures' && (
                        <>
                          <th className="p-4">Предмет</th>
                          <th className="p-4">Тема лекции</th>
                          <th className="p-4">Дата</th>
                          <th className="p-4">Лектор</th>
                          <th className="p-4">Ссылка</th>
                        </>
                      )}
                      {adminTab === 'students' && (
                        <>
                          <th className="p-4">ФИО Студента</th>
                          <th className="p-4">Группа</th>
                          <th className="p-4">Геолокация</th>
                          <th className="p-4">Последняя отметка</th>
                          <th className="p-4">Время обновления</th>
                        </>
                      )}
                      {adminTab !== 'students' && <th className="p-4 text-right">Действия</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {dataList.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-borderSoft/50 hover:bg-white/5 transition-colors">
                        {adminTab === 'schedule' && (
                          <>
                            <td className="p-4 font-bold text-textPrimary">{item.group_name}</td>
                            <td className="p-4 text-textPrimary">{item.subject_name}</td>
                            <td className="p-4 text-textSecondary">{item.teacher_name || '—'}</td>
                            <td className="p-4 text-textPrimary font-semibold">{item.time_start}–{item.time_end}</td>
                            <td className="p-4 text-textSecondary">Корпус {item.building_number || '—'}, ауд. {item.room_number || '—'}</td>
                            <td className="p-4 text-textMuted">{item.date}</td>
                          </>
                        )}
                        {adminTab === 'buildings' && (
                          <>
                            <td className="p-4 font-bold text-accentPrimary">{item.number} корпус</td>
                            <td className="p-4 text-textPrimary">{item.name}</td>
                            <td className="p-4 text-textSecondary">{item.address}</td>
                            <td className="p-4 text-textMuted max-w-xs truncate">{item.description}</td>
                          </>
                        )}
                        {adminTab === 'teachers' && (
                          <>
                            <td className="p-4 font-bold text-textPrimary">{item.full_name}</td>
                            <td className="p-4 text-textPrimary">{item.short_name}</td>
                            <td className="p-4 text-textSecondary">{item.department || '—'}</td>
                          </>
                        )}
                        {adminTab === 'lectures' && (
                          <>
                            <td className="p-4 font-bold text-textPrimary">{item.subject_name || item.subject}</td>
                            <td className="p-4 text-textPrimary">{item.title}</td>
                            <td className="p-4 text-textMuted">{item.date}</td>
                            <td className="p-4 text-textSecondary">{item.teacher_name || item.teacher || '—'}</td>
                            <td className="p-4 text-accentPrimary truncate max-w-xs"><a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">{item.url}</a></td>
                          </>
                        )}
                        {adminTab === 'students' && (
                          <>
                            <td className="p-4 font-bold text-textPrimary">{item.full_name}</td>
                            <td className="p-4 text-textPrimary">{item.group_name}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                item.location_access 
                                  ? 'bg-green-500/10 text-success border border-success/20' 
                                  : 'bg-red-500/10 text-error border border-error/20'
                              }`}>
                                {item.location_access ? 'Разрешена' : 'Закрыта'}
                              </span>
                            </td>
                            <td className="p-4 text-textSecondary">{item.last_location_name || '—'}</td>
                            <td className="p-4 text-textMuted">{item.last_location_updated_at ? new Date(item.last_location_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          </>
                        )}
                        {adminTab !== 'students' && (
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenForm(item)}
                              className="p-1.5 rounded bg-white/5 border border-borderSoft text-textSecondary hover:text-textPrimary transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-xs text-textMuted">Таблица пуста. Добавьте первый элемент.</div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* FORM MODAL (ADD / EDIT) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 text-left">
          <GlassCard className="w-full max-w-md flex flex-col gap-4 border-accentPrimary/20 p-6">
            <div className="flex justify-between items-center border-b border-borderSoft pb-3">
              <h3 className="font-bold text-sm text-textPrimary">
                {currentItem ? 'Редактировать запись' : 'Добавить новую запись'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-textMuted hover:text-textPrimary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex flex-col gap-4 text-xs">
              
              {/* Form elements for Schedule */}
              {adminTab === 'schedule' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Группа</label>
                    <select
                      value={scheduleForm.group_name}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, group_name: e.target.value }))}
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    >
                      <option value="ИС-21">ИС-21</option>
                      <option value="ЭК-11">ЭК-11</option>
                      <option value="ЮР-32">ЮР-32</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Дата</label>
                    <input
                      type="date"
                      required
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Предмет</label>
                    <input
                      type="text"
                      required
                      value={scheduleForm.subject_name}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, subject_name: e.target.value }))}
                      placeholder="Математический анализ"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Преподаватель</label>
                    <input
                      type="text"
                      value={scheduleForm.teacher_name}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, teacher_name: e.target.value }))}
                      placeholder="Иванова Н.А."
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Начало</label>
                    <input
                      type="text"
                      required
                      value={scheduleForm.time_start}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, time_start: e.target.value }))}
                      placeholder="09:00"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Конец</label>
                    <input
                      type="text"
                      required
                      value={scheduleForm.time_end}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, time_end: e.target.value }))}
                      placeholder="10:30"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Номер корпуса</label>
                    <input
                      type="number"
                      value={scheduleForm.building_number}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, building_number: e.target.value }))}
                      placeholder="3"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Аудитория</label>
                    <input
                      type="text"
                      value={scheduleForm.room_number}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, room_number: e.target.value }))}
                      placeholder="204"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form elements for Buildings */}
              {adminTab === 'buildings' && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Номер корпуса</label>
                    <input
                      type="number"
                      required
                      value={buildingForm.number}
                      onChange={(e) => setBuildingForm(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="5"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Название</label>
                    <input
                      type="text"
                      required
                      value={buildingForm.name}
                      onChange={(e) => setBuildingForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Лабораторный корпус"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Адрес</label>
                    <input
                      type="text"
                      required
                      value={buildingForm.address}
                      onChange={(e) => setBuildingForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="ул. Университетская, 7"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Описание прохода</label>
                    <textarea
                      value={buildingForm.description}
                      onChange={(e) => setBuildingForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Пешком от главного — примерно 6 минут."
                      rows={3}
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Ссылка на карту (Яндекс/Google)</label>
                    <input
                      type="text"
                      value={buildingForm.map_url}
                      onChange={(e) => setBuildingForm(prev => ({ ...prev, map_url: e.target.value }))}
                      placeholder="https://yandex.ru/maps/..."
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form elements for Teachers */}
              {adminTab === 'teachers' && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Полное имя</label>
                    <input
                      type="text"
                      required
                      value={teacherForm.full_name}
                      onChange={(e) => setTeacherForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Иванова Наталья Александровна"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Кратко (Инициалы)</label>
                    <input
                      type="text"
                      required
                      value={teacherForm.short_name}
                      onChange={(e) => setTeacherForm(prev => ({ ...prev, short_name: e.target.value }))}
                      placeholder="Иванова Н.А."
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Кафедра</label>
                    <input
                      type="text"
                      value={teacherForm.department}
                      onChange={(e) => setTeacherForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Кафедра математики"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form elements for Lectures */}
              {adminTab === 'lectures' && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Предмет</label>
                    <input
                      type="text"
                      required
                      value={lectureForm.subject_name}
                      onChange={(e) => setLectureForm(prev => ({ ...prev, subject_name: e.target.value }))}
                      placeholder="Математический анализ"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Тема лекции</label>
                    <input
                      type="text"
                      required
                      value={lectureForm.title}
                      onChange={(e) => setLectureForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Производные и пределы"
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Дата лекции</label>
                    <input
                      type="date"
                      required
                      value={lectureForm.date}
                      onChange={(e) => setLectureForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Лектор (ФИО)</label>
                    <input
                      type="text"
                      value={lectureForm.teacher_name}
                      onChange={(e) => setLectureForm(prev => ({ ...prev, teacher_name: e.target.value }))}
                      placeholder="Иванова Н.А."
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-textSecondary uppercase font-bold">Ссылка на видео/диск</label>
                    <input
                      type="url"
                      required
                      value={lectureForm.url}
                      onChange={(e) => setLectureForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com/lecture/..."
                      className="w-full mt-1 bg-bgSecondary/60 text-textPrimary border border-borderSoft rounded-lg p-2.5 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4 border-t border-borderSoft pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-2.5 bg-bgSecondary hover:bg-bgCard-hover border border-borderSoft text-textSecondary font-bold rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-accentPrimary hover:bg-accentSecondary text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
