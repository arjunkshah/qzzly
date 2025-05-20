
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileItem } from "@/types/session";
import { addFileToSession } from "@/services/sessionService";
import { useToast } from "@/hooks/use-toast";
import { File, Upload, Download, Trash } from "lucide-react";

interface FilesComponentProps {
  sessionId: string;
  files: FileItem[];
  onFileAdded: (file: FileItem) => void;
}

export function FilesComponent({ sessionId, files, onFileAdded }: FilesComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (fileList.length === 0) return;
    
    setUploading(true);
    try {
      // Process each file
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        if (file.type !== "application/pdf") {
          toast({
            title: "Error",
            description: "Only PDF files are supported",
            variant: "destructive",
          });
          continue;
        }
        
        const newFile: FileItem = {
          id: `file_${Date.now()}_${i}`,
          name: file.name,
          url: URL.createObjectURL(file), // In real app, this would be the cloud storage URL
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
        
        await addFileToSession(sessionId, newFile);
        onFileAdded(newFile);
        
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully.`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Study Materials</h2>
        <p className="text-gray-600 mb-4">
          Upload your PDF notes and study materials for AI analysis.
        </p>
        
        {/* File upload area */}
        <div
          className={`upload-area rounded-lg p-8 text-center cursor-pointer mb-6 border-2 border-dashed ${
            isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={handleBrowseClick}
        >
          <Upload className="w-12 h-12 mx-auto text-purple-500 mb-3" />
          <p className="text-gray-600 mb-2">Drag & drop your PDF files here</p>
          <p className="text-gray-400 text-sm">or</p>
          <Button 
            variant="outline" 
            className="mt-2 border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            Browse files
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files);
              }
            }}
          />
        </div>
        
        {uploading && (
          <div className="flex items-center justify-center bg-purple-50 rounded-lg p-4 mb-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-purple-500 mr-3"></div>
            <span>Uploading files...</span>
          </div>
        )}
        
        {/* File list */}
        {files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="flex">
                <div className="bg-purple-100 p-4 flex items-center justify-center">
                  <File className="h-8 w-8 text-purple-500" />
                </div>
                <CardContent className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 truncate" title={file.name}>
                        {file.name}
                      </h3>
                      <p className="text-gray-500 text-xs">
                        Uploaded {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg bg-gray-50">
            <File className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No files yet</h3>
            <p className="text-gray-500 mt-1">
              Upload your first PDF to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
