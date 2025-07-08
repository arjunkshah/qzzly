import React, { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { Session, StudyFile } from '../types';
import { processFiles } from '../utils/fileProcessor';

interface SessionsContextType {
    sessions: Session[];
    addSession: (name: string, files: FileList) => Promise<Session | undefined>;
    getSession: (id: string) => Session | null;
    deleteSession: (id: string) => void;
    updateSession: (id: string, name: string, newFiles?: FileList) => Promise<Session | undefined>;
    deleteFileFromSession: (sessionId: string, fileId: string) => Promise<StudyFile[] | undefined>;
}

const SessionsContext = createContext<SessionsContextType | undefined>(undefined);

interface SessionsProviderProps {
    children: ReactNode;
}

export const SessionsProvider: React.FC<SessionsProviderProps> = ({ children }) => {
    const [sessions, setSessions] = useState<Session[]>([]);

    useEffect(() => {
        try {
            const savedSessions = localStorage.getItem('studySessions');
            if (savedSessions) {
                setSessions(JSON.parse(savedSessions));
            }
        } catch (error) {
            console.error("Failed to load sessions from localStorage", error);
            setSessions([]);
        }
    }, []);

    const saveSessions = (newSessions: Session[]) => {
        try {
            localStorage.setItem('studySessions', JSON.stringify(newSessions));
            setSessions(newSessions);
        } catch (error) {
            console.error("Failed to save sessions to localStorage", error);
        }
    };
    
    const addSession = useCallback(async (name: string, files: FileList): Promise<Session | undefined> => {
        try {
            const processedFiles = await processFiles(files);
            const newSession: Session = {
                id: crypto.randomUUID(),
                name,
                files: processedFiles,
                createdAt: new Date().toISOString(),
            };
            const updatedSessions = [...sessions, newSession];
            saveSessions(updatedSessions);
            return newSession;
        } catch(e) {
            console.error("Error creating session:", e);
            return undefined;
        }
    }, [sessions]);

    const getSession = useCallback((id: string): Session | null => {
        return sessions.find(s => s.id === id) || null;
    }, [sessions]);

    const deleteSession = useCallback((id: string) => {
        const updatedSessions = sessions.filter(s => s.id !== id);
        saveSessions(updatedSessions);
    }, [sessions]);

    const updateSession = useCallback(async (id: string, name: string, newFiles?: FileList): Promise<Session | undefined> => {
        const sessionToUpdate = sessions.find(s => s.id === id);
        if (!sessionToUpdate) return undefined;

        let processedNewFiles: StudyFile[] = [];
        if (newFiles && newFiles.length > 0) {
            processedNewFiles = await processFiles(newFiles);
        }

        const updatedSession = {
            ...sessionToUpdate,
            name,
            files: [...sessionToUpdate.files, ...processedNewFiles],
        };
        
        const updatedSessions = sessions.map(s => s.id === id ? updatedSession : s);
        saveSessions(updatedSessions);
        return updatedSession;
    }, [sessions]);

    const deleteFileFromSession = useCallback(async (sessionId: string, fileId: string): Promise<StudyFile[] | undefined> => {
        const sessionToUpdate = sessions.find(s => s.id === sessionId);
        if (!sessionToUpdate) return undefined;

        const updatedFiles = sessionToUpdate.files.filter(f => f.id !== fileId);

        const updatedSession = { ...sessionToUpdate, files: updatedFiles };
        const updatedSessions = sessions.map(s => s.id === sessionId ? updatedSession : s);
        saveSessions(updatedSessions);
        return updatedFiles;
    }, [sessions]);

    const contextValue = { sessions, addSession, getSession, deleteSession, updateSession, deleteFileFromSession };

    return React.createElement(SessionsContext.Provider, { value: contextValue }, children);
};

export const useSessions = (): SessionsContextType => {
    const context = useContext(SessionsContext);
    if (context === undefined) {
        throw new Error('useSessions must be used within a SessionsProvider');
    }
    return context;
};