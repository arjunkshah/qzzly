
import React, { useState } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { useSessions } from '../hooks/useSessions';
import { Session } from '../types';
import FileUploader from '../components/FileUploader';
import { IconTrash2, IconPlusCircle } from '../constants';
import Loader from '../components/Loader';

const SessionCard: React.FC<{ session: Session; onDelete: (id: string) => void }> = ({ session, onDelete }) => {
    const navigate = ReactRouterDom.useNavigate();
    const fileCount = session.files.length;
    const date = new Date(session.createdAt).toLocaleDateString();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete the session "${session.name}"?`)) {
            onDelete(session.id);
        }
    };
    
    return (
        <div 
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            onClick={() => navigate(`/session/${session.id}`)}
        >
            <div>
                <h3 className="text-xl font-bold text-primary-600 dark:text-primary-400 truncate">{session.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{fileCount} file(s)</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">Created: {date}</p>
                <button 
                    onClick={handleDelete}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Delete session ${session.name}`}
                >
                    <IconTrash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const NewSessionModal: React.FC<{ onClose: () => void; onCreate: (name: string, files: FileList) => Promise<void> }> = ({ onClose, onCreate }) => {
    const [sessionName, setSessionName] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!sessionName.trim()) {
            setError('Please enter a session name.');
            return;
        }
        if (!files || files.length === 0) {
            setError('Please upload at least one file.');
            return;
        }
        setIsLoading(true);
        await onCreate(sessionName, files);
        // Loading state will be handled by parent, which will close the modal on success
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">Create New Study Session</h2>
                {isLoading ? <Loader text="Creating session..." /> : (
                    <>
                        <div className="mb-4">
                            <label htmlFor="session-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Name</label>
                            <input
                                type="text"
                                id="session-name"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
                                placeholder="e.g., Biology Midterm"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Files</label>
                            <FileUploader onFileUpload={(uploadedFiles) => setFiles(uploadedFiles)} isLoading={false} error="" />
                        </div>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <div className="flex justify-end gap-4">
                            <button onClick={onClose} className="py-2 px-4 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                            <button onClick={handleCreate} className="py-2 px-4 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700">Create Session</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


const DashboardPage: React.FC = () => {
    const { sessions, addSession, deleteSession } = useSessions();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = ReactRouterDom.useNavigate();

    const handleCreateSession = async (name: string, files: FileList) => {
        const newSession = await addSession(name, files);
        if (newSession) {
            setIsModalOpen(false);
            navigate(`/session/${newSession.id}`);
        } else {
            // Error handling can be improved in the modal itself
            console.error("Failed to create session");
        }
    };
    
    // Sort sessions by most recently created
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Your Study Sessions</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-300"
                >
                    <IconPlusCircle className="w-5 h-5" />
                    New Session
                </button>
            </header>

            {sortedSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedSessions.map(session => (
                        <SessionCard key={session.id} session={session} onDelete={deleteSession} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">No sessions yet!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Click "New Session" to upload your first documents and get started.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Create Your First Session
                    </button>
                </div>
            )}

            {isModalOpen && <NewSessionModal onClose={() => setIsModalOpen(false)} onCreate={handleCreateSession} />}
        </div>
    );
};

export default DashboardPage;
