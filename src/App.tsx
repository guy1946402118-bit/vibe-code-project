import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './stores/userStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { NotesPage } from './pages/NotesPage';
import { RewardsPage } from './pages/RewardsPage';
import { ReviewPage } from './pages/ReviewPage';
import { LearningPage } from './pages/LearningPage';
import { PushPage } from './pages/PushPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { BlogEditorPage } from './pages/BlogEditorPage';
import { DashboardBlogPage } from './pages/DashboardBlogPage';
import { BlogPage } from './pages/BlogPage';
import { TrainingPage } from './pages/TrainingPage';
import { CmsPage } from './pages/CmsPage';
import { CheckInPage } from './pages/CheckInPage';
import { GoalsPage } from './pages/GoalsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { HeatmapPage } from './pages/HeatmapPage';
import { LifeFlowerPage } from './pages/LifeFlowerPage';
import { SettingsPage } from './pages/SettingsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SkillDepotPage } from './pages/SkillDepotPage';
import { ToastContainer } from './components/Toast';
import { PushRegistration } from './components/PushRegistration';
import { CommandPalette } from './components/CommandPalette';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUserStore();
  if (!currentUser) {
    return <Navigate to="/blog" replace />;
  }
  return <Layout currentUser={currentUser}>{children}</Layout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, currentUser } = useUserStore();
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Layout currentUser={currentUser}>{children}</Layout>;
}

function App() {
  const { init, isLoading } = useUserStore();
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialized) {
        setInitError('初始化超时，请刷新页面');
        setInitialized(true);
      }
    }, 10000);
    
    init().then(() => {
      setInitialized(true);
      clearTimeout(timer);
    }).catch(err => {
      console.error('Init error:', err);
      setInitError('初始化失败: ' + err.message);
      setInitialized(true);
      clearTimeout(timer);
    });
    
    return () => clearTimeout(timer);
  }, [init]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!initialized || isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0a0a0f',
        color: '#00f0ff',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          border: '3px solid rgba(0,240,255,0.3)',
          borderTopColor: '#00f0ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div>加载中...</div>
        {initError && (
          <div style={{ color: '#ff4444', fontSize: '14px' }}>{initError}</div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/blog" element={<Layout><DashboardBlogPage /></Layout>} />
        <Route path="/blog/posts" element={<Layout><BlogPage /></Layout>} />
        <Route path="/blog/new" element={<PrivateRoute><BlogEditorPage /></PrivateRoute>} />
        <Route path="/blog/:slug" element={<Layout><BlogPostPage /></Layout>} />
        
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        
        <Route path="/notes" element={<PrivateRoute><NotesPage /></PrivateRoute>} />
        <Route path="/rewards" element={<PrivateRoute><RewardsPage /></PrivateRoute>} />
        <Route path="/review" element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
        <Route path="/learning" element={<PrivateRoute><LearningPage /></PrivateRoute>} />
        <Route path="/push" element={<PrivateRoute><PushPage /></PrivateRoute>} />
        <Route path="/training" element={<PrivateRoute><TrainingPage /></PrivateRoute>} />
        <Route path="/checkin" element={<PrivateRoute><CheckInPage /></PrivateRoute>} />
        <Route path="/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
        <Route path="/achievements" element={<PrivateRoute><AchievementsPage /></PrivateRoute>} />
        <Route path="/heatmap" element={<PrivateRoute><HeatmapPage /></PrivateRoute>} />
        <Route path="/lifeflower" element={<PrivateRoute><LifeFlowerPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
        <Route path="/skills" element={<PrivateRoute><SkillDepotPage /></PrivateRoute>} />
        <Route path="/cms" element={<AdminRoute><CmsPage /></AdminRoute>} />
      </Routes>

      <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      <ToastContainer />
      <PushRegistration />
    </BrowserRouter>
  );
}

export default App;
