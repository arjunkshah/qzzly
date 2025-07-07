
import React from 'react';
import Loader from '../Loader';

interface ViewContainerProps {
    title: string;
    isLoading: boolean;
    error: string | null;
    children: React.ReactNode;
    generationText?: string;
}

const ViewContainer: React.FC<ViewContainerProps> = ({ title, isLoading, error, children, generationText }) => {
    return (
        <div className="h-full flex flex-col text-gray-800 dark:text-gray-200">
            <h2 className="text-3xl font-bold mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">{title}</h2>
            {isLoading && <div className="flex-grow flex items-center justify-center"><Loader text={generationText || `Generating ${title}...`} /></div>}
            {error && <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/30 dark:border-red-600 dark:text-red-300">{error}</div>}
            {!isLoading && !error && (
                <div className="flex-grow overflow-y-auto pr-2">
                    {children}
                </div>
            )}
        </div>
    );
};

export default ViewContainer;
