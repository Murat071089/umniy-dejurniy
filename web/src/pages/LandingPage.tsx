import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, User, BookOpen, Mic, Send, 
  ArrowRight, ShieldAlert, Sparkles, CheckCircle, ExternalLink 
} from 'lucide-react';
import { ThemeToggle, GlassCard, PremiumIcon } from '../components/UI';

interface LandingPageProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [demoChat, setDemoChat] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Привет! Я Умный дежурный. Задай мне любой вопрос, например: «Где 5 корпус?» или «Кто ведет матан?»' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const demoScenarios = [
    { 
      question: 'Где 5 корпус?', 
      answer: '🏫 5 корпус — лабораторный корпус (ул. Университетская, 7). От главного учебного корпуса пешком идти около 6 минут.' 
    },
    { 
      question: 'Кто ведёт матан?', 
      answer: '👨‍🏫 Математический анализ у группы ИС-21 ведёт Иванова Наталья Александровна (Кафедра математики).' 
    },
    { 
      question: 'Где Анна Смирнова?', 
      answer: '📍 Анна Смирнова не открыла доступ к геолокации. Я не могу показывать её местоположение без разрешения.' 
    },
    { 
      question: 'Расписание на завтра', 
      answer: '📅 Расписание на завтра для группы ИС-21:\n🕐 09:00–10:30 — История (Петров С.К., 1 корпус, ауд. 110)\n🕐 10:45–12:15 — Базы данных (Орлова Е.В., 3 корпус, ауд. 307)\n🕐 13:00–14:30 — Физкультура (спортзал)' 
    }
  ];

  const handleDemoQuestionClick = (question: string, answer: string) => {
    if (isTyping) return;
    
    // Add user question
    setDemoChat(prev => [...prev, { sender: 'user', text: question }]);
    setIsTyping(true);

    // Simulate bot typing
    setTimeout(() => {
      setDemoChat(prev => [...prev, { sender: 'bot', text: answer }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className={`min-h-screen relative overflow-hidden theme-transition ${theme === 'dark' ? 'bg-glow-dark' : 'bg-glow-light'}`}>
      <div className="noise-overlay"></div>
      
      {/* HEADER */}
      <header className="relative max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accentPrimary flex items-center justify-center shadow-lg glow-orange-soft">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-textPrimary">
            Умный дежурный
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button 
            onClick={() => navigate('/app')}
            className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 bg-accentPrimary hover:bg-accentSecondary text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-md glow-orange-soft"
          >
            Открыть демо
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-6 pt-12 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accentSoft border border-accentPrimary/20 rounded-full text-xs font-semibold text-accentPrimary w-fit">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Цифровой помощник студента
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-textPrimary leading-[1.1]">
            Вся информация вуза <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentPrimary to-goldSoft">
              в одном вопросе
            </span>
          </h1>
          <p className="text-lg text-textSecondary max-w-2xl leading-relaxed">
            «Умный дежурный» отвечает на вопросы о расписании, корпусах, преподавателях и лекциях за несколько секунд. Забудь про хаос в чатах, таблицах и поисках старосты.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <button 
              onClick={() => navigate('/app')}
              className="px-8 py-4 bg-accentPrimary hover:bg-accentSecondary text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg glow-orange flex items-center gap-2"
            >
              Открыть Demo Web App
              <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="https://t.me/umniy_dejurniy_bot" 
              target="_blank" 
              rel="noreferrer"
              className="px-8 py-4 bg-bgCard hover:bg-bgCard-hover border border-borderSoft text-textPrimary font-semibold rounded-2xl transition-all duration-200 flex items-center gap-2"
            >
              Запустить в Telegram
              <ExternalLink className="w-5 h-5 text-textMuted" />
            </a>
          </div>
        </div>
        
        {/* RIGHT SIDE PHONE MOCKUP PREVIEW */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative p-4 bg-neutral-900/40 rounded-[56px] border border-white/5 shadow-2xl backdrop-blur-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-accentPrimary to-goldSoft rounded-[56px] opacity-10 blur-xl"></div>
            {/* Phone shell */}
            <div className="w-[310px] aspect-[9/18.5] bg-black rounded-[42px] p-2.5 overflow-hidden border-4 border-neutral-800 shadow-inner flex flex-col text-left">
              <div className="w-full h-full bg-neutral-950 rounded-[32px] overflow-hidden flex flex-col relative select-none">
                {/* Dynamic island */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 h-4.5 bg-black rounded-full z-20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-accentPrimary rounded-full absolute right-2"></div>
                </div>
                
                {/* Visual interface mockup */}
                <div className="flex-1 p-4 pt-10 flex flex-col justify-between text-white bg-gradient-to-b from-[#1E1410] to-[#0A0706]">
                  <div>
                    <div className="text-[10px] text-textMuted font-bold">УМНЫЙ ДЕЖУРНЫЙ</div>
                    <div className="text-sm font-bold text-textPrimary mt-1">Спроси дежурного</div>
                    
                    <div className="mt-4 p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-textSecondary">
                      Напиши вопрос, например:<br />
                      <span className="text-accentPrimary">«Где сейчас 5 корпус?»</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <div className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] text-textMuted">Кто ведет матан?</div>
                      <div className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] text-textMuted">Пары завтра</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="p-3 bg-accentPrimary/10 border border-accentPrimary/20 rounded-2xl text-[9px] text-accentSecondary flex flex-col gap-1">
                      <div className="font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-accentPrimary" />
                        Ответ получен:
                      </div>
                      5 корпус находится во внутреннем дворе. Идти от главного 6 минут.
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-textMuted flex items-center">
                        Напиши вопрос...
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-accentPrimary flex items-center justify-center">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMS SECTION */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 border-t border-borderSoft z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-textPrimary">
            Студенты теряют время не на учёбу, а на поиск информации
          </h2>
          <p className="text-textSecondary mt-4">
            Почему существующие способы поиска информации вызывают головную боль:
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="flex flex-col gap-4 text-left group">
            <PremiumIcon icon={Calendar} variant="danger" size={24} className="w-12 h-12 rounded-2xl" />
            <h3 className="font-bold text-lg text-textPrimary">Хаос в расписании</h3>
            <p className="text-sm text-textSecondary leading-relaxed">
              Расписание лежит на сайте вуза, изменения присылают в чаты старосты, а замены вывешивают на стенде. Свести это воедино — квест.
            </p>
          </GlassCard>

          <GlassCard className="flex flex-col gap-4 text-left group">
            <PremiumIcon icon={BookOpen} variant="danger" size={24} className="w-12 h-12 rounded-2xl" />
            <h3 className="font-bold text-lg text-textPrimary">Потерянные лекции</h3>
            <p className="text-sm text-textSecondary leading-relaxed">
              Записи лекций и учебные материалы сбрасывают в общую кучу в облаке или теряют в километрах переписок групповых чатов.
            </p>
          </GlassCard>

          <GlassCard className="flex flex-col gap-4 text-left group">
            <PremiumIcon icon={MapPin} variant="danger" size={24} className="w-12 h-12 rounded-2xl" />
            <h3 className="font-bold text-lg text-textPrimary">Неизвестность в корпусах</h3>
            <p className="text-sm text-textSecondary leading-relaxed">
              Названия аудиторий вроде «ауд. 305» не объясняют, в каком корпусе она находится, на каком этаже и как туда быстрее дойти со двора.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 border-t border-borderSoft bg-bgSecondary/20 z-10 rounded-[32px] mb-20 theme-transition">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-textPrimary">
            Один вопрос — один точный ответ
          </h2>
          <p className="text-textSecondary mt-4">
            Процесс взаимодействия с Умным дежурным максимально прост
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-14 h-14 rounded-full bg-accentSoft border border-accentPrimary/30 flex items-center justify-center text-accentPrimary font-bold text-xl mb-4">
              1
            </div>
            <h4 className="font-bold text-lg text-textPrimary mb-2">Задаёшь вопрос</h4>
            <p className="text-sm text-textSecondary leading-relaxed">
              Студент пишет или говорит вопрос обычным языком в боте или в Web App. Без шаблонов и жестких команд.
            </p>
          </div>

          <div className="flex flex-col items-center text-center px-4">
            <div className="w-14 h-14 rounded-full bg-accentSoft border border-accentPrimary/30 flex items-center justify-center text-accentPrimary font-bold text-xl mb-4">
              2
            </div>
            <h4 className="font-bold text-lg text-textPrimary mb-2">Система понимает смысл</h4>
            <p className="text-sm text-textSecondary leading-relaxed">
              NLP парсер распознает намерения (интенты) и извлекает параметры, учитывая опечатки и сокращения предметов.
            </p>
          </div>

          <div className="flex flex-col items-center text-center px-4">
            <div className="w-14 h-14 rounded-full bg-accentSoft border border-accentPrimary/30 flex items-center justify-center text-accentPrimary font-bold text-xl mb-4">
              3
            </div>
            <h4 className="font-bold text-lg text-textPrimary mb-2">Получаешь точный ответ</h4>
            <p className="text-sm text-textSecondary leading-relaxed">
              Бот или веб-приложение мгновенно возвращают ответ из базы данных: с картой, временем, именами и статусами.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 border-t border-borderSoft z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-textPrimary">
            Возможности платформы
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            { icon: Calendar, variant: 'primary', title: 'Расписание', desc: 'Просмотр пар на сегодня, завтра или неделю с автоматическим отслеживанием замен.' },
            { icon: MapPin, variant: 'gold', title: 'Корпуса и аудитории', desc: 'Быстрый поиск расположения аудитории, этажа и схемы прохода между корпусами.' },
            { icon: User, variant: 'primary', title: 'Преподаватели', desc: 'Информация о том, кто ведёт предмет, с какой он кафедры и где у него ближайшая пара.' },
            { icon: BookOpen, variant: 'gold', title: 'Записи лекций', desc: 'Удобный архив прошедших лекций, распределенный по темам и предметам с конспектами.' },
            { icon: ShieldAlert, variant: 'danger', title: 'Геолокация с разрешения', desc: 'Поиск местоположения одногруппников на карте внутри университета с гибким доступом.' },
            { icon: Mic, variant: 'success', title: 'Голосовые вопросы', desc: 'Возможность надиктовать вопрос голосом, если неудобно вводить текст на ходу.' },
          ].map((feat, index) => {
            return (
              <GlassCard key={index} className="flex gap-4 group">
                <PremiumIcon icon={feat.icon} variant={feat.variant as any} size={20} className="w-12 h-12 rounded-2xl flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-textPrimary text-base mb-1">{feat.title}</h4>
                  <p className="text-xs text-textSecondary leading-relaxed">{feat.desc}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* PERSONA BLOCK */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 border-t border-borderSoft bg-bgSecondary/10 z-10 rounded-[32px] mb-20 theme-transition">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex justify-center">
            {/* Avatar Profile Card */}
            <GlassCard className="w-full max-w-sm flex flex-col gap-4 text-center border-accentPrimary/20">
              <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-accentPrimary to-goldSoft p-1">
                <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  А
                </div>
                <div className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-success border-2 border-neutral-900 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-xl text-textPrimary">Артём</h4>
                <p className="text-xs text-textSecondary">студент 2 курса · группа ИС-21</p>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-borderSoft pt-4 text-xs">
                <div>
                  <div className="text-textMuted font-bold">Возраст</div>
                  <div className="text-textPrimary mt-0.5 font-semibold">19 лет</div>
                </div>
                <div>
                  <div className="text-textMuted font-bold">Город</div>
                  <div className="text-textPrimary mt-0.5 font-semibold">Нальчик</div>
                </div>
                <div>
                  <div className="text-textMuted font-bold">Роль</div>
                  <div className="text-textPrimary mt-0.5 font-semibold">Студент</div>
                </div>
              </div>
            </GlassCard>
          </div>
          
          <div className="lg:col-span-7 flex flex-col gap-5 text-left">
            <h2 className="text-3xl font-bold text-textPrimary">
              Для кого создан проект?
            </h2>
            <p className="text-textSecondary leading-relaxed">
              Артём не хочет каждый раз спрашивать в чате то, что должно находиться за 5 секунд. Ему важно быстро понимать, где пара, кто преподаватель, в каком корпусе находится нужная аудитория и есть ли запись лекции.
            </p>
            <div className="flex flex-col gap-2 mt-2 text-sm text-textPrimary font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accentPrimary"></div>
                Ценит своё время на перерывах
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accentPrimary"></div>
                Предпочитает один удобный интерфейс вместо кучи файлов
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accentPrimary"></div>
                Хочет быстро находить друзей в корпусе
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO SCENARIO */}
      <section className="relative max-w-5xl mx-auto px-6 py-20 border-t border-borderSoft z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-textPrimary">
            Попробуйте сценарий в один клик
          </h2>
          <p className="text-textSecondary mt-2">
            Выберите готовый вопрос, чтобы увидеть, как бот находит ответ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Quick choices list */}
          <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
            {demoScenarios.map((scen, idx) => (
              <button
                key={idx}
                onClick={() => handleDemoQuestionClick(scen.question, scen.answer)}
                className="w-full text-left p-4 bg-bgCard hover:bg-bgCard-hover border border-borderSoft rounded-2xl transition-all duration-200 hover:border-accentPrimary hover:translate-x-1 flex items-center justify-between group focus:outline-none"
              >
                <span className="text-sm font-semibold text-textPrimary">{scen.question}</span>
                <ArrowRight className="w-4 h-4 text-textMuted group-hover:text-accentPrimary transition-colors" />
              </button>
            ))}
          </div>

          {/* Interactive Chat Window */}
          <div className="lg:col-span-7">
            <GlassCard className="h-[320px] flex flex-col justify-between overflow-hidden relative p-0 border-accentPrimary/10">
              <div className="bg-bgSecondary/40 px-4 py-3 border-b border-borderSoft flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-textPrimary">Чат Демо-помощника</span>
                </div>
                <button 
                  onClick={() => setDemoChat([{ sender: 'bot', text: 'Привет! Я Умный дежурный. Задай мне любой вопрос...' }])}
                  className="text-[10px] text-textMuted hover:text-accentPrimary transition-colors"
                >
                  Очистить
                </button>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-left">
                {demoChat.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-accentPrimary text-white ml-auto'
                        : 'bg-bgSecondary/70 border border-borderSoft text-textSecondary mr-auto whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="bg-bgSecondary/70 border border-borderSoft text-textMuted mr-auto rounded-2xl px-4 py-2 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-textMuted rounded-full animate-bounce delay-200"></span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 border-t border-borderSoft text-center z-10">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-textPrimary">
          Готовы протестировать MVP?
        </h2>
        <p className="text-textSecondary mt-4 max-w-2xl mx-auto leading-relaxed">
          Мы проверяем главный сценарий будущего приложения: студент задаёт вопрос обычным языком и получает ответ за несколько секунд.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button 
            onClick={() => navigate('/app')}
            className="px-8 py-4 bg-accentPrimary hover:bg-accentSecondary text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg glow-orange flex items-center gap-2"
          >
            Запустить Web App
            <ArrowRight className="w-5 h-5" />
          </button>
          <a 
            href="https://t.me/umniy_dejurniy_bot" 
            target="_blank" 
            rel="noreferrer"
            className="px-8 py-4 bg-bgCard hover:bg-bgCard-hover border border-borderSoft text-textPrimary font-semibold rounded-2xl transition-all duration-200 flex items-center gap-2"
          >
            Войти в Telegram-бота
            <ExternalLink className="w-5 h-5 text-textMuted" />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-borderSoft py-8 text-center text-xs text-textMuted z-10 relative">
        <p>© 2026 Умный дежурный · Сделано для демонстрации MVP цифрового помощника</p>
      </footer>
    </div>
  );
};

export default LandingPage;
