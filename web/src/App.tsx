import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WebApp from './pages/WebApp';
import AdminPanel from './pages/AdminPanel';
import { GlobalSVGDefs } from './components/UI';

function App() {
  // Read initial theme from localStorage or fallback to default 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  // Apply theme class/attribute on state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <HashRouter>
      <GlobalSVGDefs />
      <Routes>
        <Route path="/" element={<LandingPage theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/app" element={<WebApp theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin" element={<AdminPanel theme={theme} toggleTheme={toggleTheme} />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
