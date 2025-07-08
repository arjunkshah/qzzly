import React from 'react';

interface ViewContainerProps {
    title: string;
    isLoading: boolean;
    error: string | null;
    children: React.ReactNode;
    generationText?: string;
}

const ViewContainer: React.FC<ViewContainerProps> = ({ title, isLoading, error, children, generationText }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    {generationText || "Processing..."}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="text-red-500 text-center">
                    <h3 className="text-lg font-semibold mb-2">Error</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <h2 className="text-2xl font-bold mb-6">{title}</h2>
            {children}
        </div>
    );
};

export default ViewContainer; 