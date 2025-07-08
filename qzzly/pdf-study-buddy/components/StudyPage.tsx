
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { StudyMode, Session } from '../types';
import { NAVIGATION_ITEMS, IconUploadCloud, IconTrash2, IconPlusCircle } from '../constants';
import { useSessions } from '../hooks/useSessions';
import SummaryView from './views/SummaryView';
import NotesView from './views/NotesView';
import OutlineView from './views/OutlineView';
import FlashcardsView from './views/FlashcardsView';
import QuizView from './views/QuizView';
import ChatView from './views/ChatView';
import StudyPlanView from './views/StudyPlanView';
import ConceptMapView from './views/ConceptMapView';
import FileUploader from './FileUploader';
import Loader from './Loader';

const StudyPage: React.FC = () => {
  const [activeMode, setActiveMode] = useState<StudyMode>(StudyMode.SUMMARY);
  const { sessionId } = ReactRouterDom.useParams<{ sessionId: string }>();
  const navigate = ReactRouterDom.useNavigate();
  const { getSession, updateSession, deleteFileFromSession } = useSessions();
  
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  useEffect(() => {
    if (sessionId) {
      const currentSession = getSession(sessionId);
      setSession(currentSession);
      if (!currentSession) {
        navigate('/dashboard');
      }
    }
  }, [sessionId, getSession, navigate]);

  const handleFileDelete = async (fileId: string) => {
    if (session) {
      const newFileList = await deleteFileFromSession(session.id, fileId);
      if (newFileList) {
        setSession(prev => prev ? {...prev, files: newFileList} : null);
      }
    }
  };
  
  const handleFileUpload = async (uploadedFiles: FileList) => {
    if (session && uploadedFiles.length > 0) {
      setIsUploaderOpen(false);
      setIsProcessingFiles(true);
      const updatedSession = await updateSession(session.id, session.name, uploadedFiles);
      if(updatedSession) {
        setSession(updatedSession);
      }
      setIsProcessingFiles(false);
    }
  };

  const renderContent = () => {
    if (!session?.files || session.files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <IconUploadCloud className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">This session is empty.</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Add some files to get started with your study session.</p>
                <button
                    onClick={() => setIsUploaderOpen(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-300"
                >
                    <IconPlusCircle className="w-5 h-5" />
                    Add Files
                </button>
            </div>
        )
    }

    switch (activeMode) {
      case StudyMode.SUMMARY:
        return <SummaryView files={session.files} />;
      case StudyMode.NOTES:
        return <NotesView files={session.files} />;
      case StudyMode.OUTLINE:
        return <OutlineView files={session.files} />;
      case StudyMode.FLASHCARDS:
        return <FlashcardsView files={session.files} />;
      case StudyMode.QUIZ:
        return <QuizView files={session.files} />;
      case StudyMode.CHAT:
        return <ChatView files={session.files} />;
      case StudyMode.STUDY_PLAN:
        return <StudyPlanView files={session.files} />;
      case StudyMode.CONCEPT_MAP:
        return <ConceptMapView files={session.files} />;
      default:
        return null;
    }
  };

  if (session === undefined) {
    return <div className="flex items-center justify-center h-screen"><Loader text="Loading Session..." /></div>;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-gray-50 dark:bg-gray-950 p-4 flex flex-col justify-between border-r border-gray-200 dark:border-gray-800">
        <div>
          <div className="px-2 mb-6">
            <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                &larr; Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 truncate" title={session?.name}>{session?.name}</h1>
          </div>
          
          <div className="mb-6 px-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Source Files</h2>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 max-h-32 overflow-y-auto pr-1">
              {session?.files.map(file => (
                <li key={file.id} className="flex items-center justify-between group bg-white dark:bg-gray-800/50 p-2 rounded-md">
                  <span className="truncate" title={file.name}>{file.name}</span>
                  <button onClick={() => handleFileDelete(file.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-opacity">
                    <IconTrash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
             <button onClick={() => setIsUploaderOpen(true)} className="w-full mt-2 text-sm flex items-center justify-center gap-2 p-2 rounded-lg bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/50 dark:hover:bg-primary-900 text-primary-700 dark:text-primary-200 transition-colors">
                <IconPlusCircle className="w-4 h-4" /> Add More Files
            </button>
          </div>

          <nav>
            <ul>
              {NAVIGATION_ITEMS.map(item => (
                <li key={item.mode}>
                  <button
                    onClick={() => setActiveMode(item.mode)}
                    disabled={!session?.files || session.files.length === 0}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors duration-200 ${
                      activeMode === item.mode
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.mode}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
            {isProcessingFiles ? <div className="flex items-center justify-center h-full"><Loader text="Processing new files..." /></div> : renderContent()}
        </div>
      </main>

      {isUploaderOpen && (
         <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50" onClick={() => setIsUploaderOpen(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4">Add Files to Your Session</h2>
                <FileUploader onFileUpload={handleFileUpload} isLoading={false} error="" />
            </div>
         </div>
      )}
    </div>
  );
};

export default StudyPage;