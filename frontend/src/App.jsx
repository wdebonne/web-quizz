import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuizEditor from './pages/QuizEditor';
import GameLobby from './pages/GameLobby';
import GameControl from './pages/GameControl';
import GameProjection from './pages/GameProjection';
import History from './pages/History';
import Admin from './pages/Admin';
import ParticipantJoin from './pages/ParticipantJoin';
import ParticipantWaiting from './pages/ParticipantWaiting';
import ParticipantPlay from './pages/ParticipantPlay';
import GameFinished from './pages/GameFinished';
import ResetPassword from './pages/ResetPassword';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && !['admin', ...(role === 'creator' ? ['creator'] : [])].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AppSettingsProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Participant (public) */}
            <Route path="/join" element={<ParticipantJoin />} />
            <Route path="/join/:code" element={<ParticipantJoin />} />
            <Route path="/play/:sessionId/waiting" element={<ParticipantWaiting />} />
            <Route path="/play/:sessionId" element={<ParticipantPlay />} />
            <Route path="/play/:sessionId/finished" element={<GameFinished />} />

            {/* Projection screen (public URL, auth optional) */}
            <Route path="/projection/:sessionId" element={<GameProjection />} />

            {/* Creator */}
            <Route path="/dashboard" element={<PrivateRoute role="creator"><Dashboard /></PrivateRoute>} />
            <Route path="/quiz/new" element={<PrivateRoute role="creator"><QuizEditor /></PrivateRoute>} />
            <Route path="/quiz/:id" element={<PrivateRoute role="creator"><QuizEditor /></PrivateRoute>} />
            <Route path="/game/:id/lobby" element={<PrivateRoute role="creator"><GameLobby /></PrivateRoute>} />
            <Route path="/game/:id/control" element={<PrivateRoute role="creator"><GameControl /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute role="creator"><History /></PrivateRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<PrivateRoute role="admin"><Admin /></PrivateRoute>} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </AppSettingsProvider>
  );
}
