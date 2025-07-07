
import React, { useState, useCallback } from 'react';
import { IconUploadCloud } from '../constants';
import Loader from './Loader';

interface FileUploaderProps {
  onFileUpload: (files: FileList) => void;
  isLoading: boolean;
  error: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, isLoading, error }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  };

  if (isLoading) {
    return (
        <Loader text="Analyzing your documents..." />
    );
  }

  return (
    <div className="w-full text-center">
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`p-8 border-2 border-dashed rounded-xl transition-colors duration-300 ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'}`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center space-y-4">
            <IconUploadCloud className="w-16 h-16 text-gray-400 dark:text-gray-500" />
            <div className="text-center">
              <span className="font-semibold text-primary-600 dark:text-primary-400">Click to upload</span>
              <span className="text-gray-500 dark:text-gray-400"> or drag and drop</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">PDF, PNG, JPG, JPEG</p>
          </label>
        </div>
        
        {error && (
            <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
                <p className="font-semibold">An Error Occurred</p>
                <p>{error}</p>
            </div>
        )}
      </div>
  );
};

export default FileUploader;
