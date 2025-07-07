
import React from 'react';

interface LoaderProps {
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "Processing..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg text-gray-600 dark:text-gray-300">{text}</p>
    </div>
  );
};

export default Loader;
