import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import AuthGuard from './components/shared/AuthGuard';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import LogPage from './pages/LogPage';
import ModePage from './pages/ModePage';
import ProfilePage from './pages/ProfilePage';
import TaskDeconstructorMode from './components/modes/TaskDeconstructorMode';
import DigitalFrictionMode from './components/modes/DigitalFrictionMode';
import NextActionClarifierMode from './components/modes/NextActionClarifierMode';
import SingleContextLockMode from './components/modes/SingleContextLockMode_clean';
import DoneOverPerfectMode from './components/modes/DoneOverPerfectMode';
import NoveltySelectorMode from './components/modes/NoveltySelectorMode';

// Components
import { LayoutDashboard, CheckSquare, Clock, LogOut, Zap, User } from 'lucide-react';
import { SessionProvider } from './contexts/SessionContext';
import SessionWidget from './components/sessions/SessionWidget';
import FloatingQuickLogButton from './components/shared/FloatingQuickLogButton';

// Quick Log Context
const QuickLogContext = createContext();
export const useQuickLog = () => useContext(QuickLogContext);

const Navbar = () => 
  {
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (['/', '/login', '/register'].includes(location.pathname)) return null;

  return (
    <nav className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        IdleInsights
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          <LayoutDashboard size={18} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Dashboard
        </Link>
        <Link to="/tasks" className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}>
          <CheckSquare size={18} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Tasks
        </Link>
        <Link to="/log" className={`nav-link ${location.pathname === '/log' ? 'active' : ''}`}>
          <Clock size={18} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Log Avoidance
        </Link>
        <Link to="/modes" className={`nav-link ${location.pathname.startsWith('/modes') ? 'active' : ''}`}>
          <Zap size={18} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Modes
        </Link>
        <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
          <User size={18} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Profile
        </Link>
        <button onClick={handleLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Logout
        </button>
      </div>
    </nav>
  );
};

function App() {
  const [showQuickLog, setShowQuickLog] = useState(false);
  const location = useLocation();
  const isAuthPage = ['/', '/login', '/register'].includes(location.pathname);

  // Global keyboard shortcut: Ctrl+L
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'l' && !isAuthPage) {
        e.preventDefault();
        setShowQuickLog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthPage]);

  return (
    <SessionProvider>
      <QuickLogContext.Provider value={{ showQuickLog, setShowQuickLog }}>
        <div className="app-container">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/log" element={<LogPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/modes" element={<ModePage />} />
              
              {/* Mode Routes */}
              <Route path="/modes/task-deconstructor" element={<TaskDeconstructorMode />} />
              <Route path="/modes/task-deconstructor/:modeId" element={<TaskDeconstructorMode />} />
              
              <Route path="/modes/digital-friction" element={<DigitalFrictionMode />} />
              <Route path="/modes/digital-friction/:modeId" element={<DigitalFrictionMode />} />
              
              <Route path="/modes/next-action-clarifier" element={<NextActionClarifierMode />} />
              <Route path="/modes/next-action-clarifier/:modeId" element={<NextActionClarifierMode />} />
              
              <Route path="/modes/single-context-lock" element={<SingleContextLockMode />} />
              <Route path="/modes/single-context-lock/:modeId" element={<SingleContextLockMode />} />
              
              <Route path="/modes/done-over-perfect" element={<DoneOverPerfectMode />} />
              <Route path="/modes/done-over-perfect/:modeId" element={<DoneOverPerfectMode />} />
              
              <Route path="/modes/novelty-injection" element={<NoveltySelectorMode />} />
              <Route path="/modes/novelty-injection/:modeId" element={<NoveltySelectorMode />} />
            </Route>
          </Routes>
          {!isAuthPage && <SessionWidget />}
          {!isAuthPage && <FloatingQuickLogButton />}
        </div>
      </QuickLogContext.Provider>
    </SessionProvider>
  );
}

export default App;
