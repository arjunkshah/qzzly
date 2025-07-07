
import React from 'react';
import * as ReactRouterDom from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import StudyPage from './components/StudyPage';
import LandingPage from './pages/LandingPage';
import { SessionsProvider } from './hooks/useSessions';

const App: React.FC = () => {
    return (
        <SessionsProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans">
                <ReactRouterDom.Routes>
                    <ReactRouterDom.Route path="/" element={<LandingPage />} />
                    <ReactRouterDom.Route path="/dashboard" element={<DashboardPage />} />
                    <ReactRouterDom.Route path="/session/:sessionId" element={<StudyPage />} />
                </ReactRouterDom.Routes>
            </div>
        </SessionsProvider>
    );
};

export default App;
