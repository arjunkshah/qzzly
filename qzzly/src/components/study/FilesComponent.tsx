import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processFiles } from "@/utils/fileProcessor";
import { generateSummary, generateFlashcards, generateQuiz } from "@/services/geminiService";
import { FileItem } from "@/types/session";

interface FilesComponentProps {
  sessionId: string;
  files: FileItem[];
  onFileAdded: (file: FileItem) => void;
}

export function FilesComponent({ sessionId, files, onFileAdded }: FilesComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
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
      const processedFiles = await processFiles(fileList);
      
      for (const file of processedFiles) {
        onFileAdded(file);
        // No auto-generation of AI content here
        toast({
          title: "File uploaded",
          description: `${file.name} was uploaded successfully.`,
        });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Upload Study Materials</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload PDFs, images, or other documents to generate study materials
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-gray-300 dark:border-gray-600 hover:border-primary"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">
          {isDragging ? "Drop files here" : "Drag and drop files here"}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supports PDF, PNG, JPG files
        </p>
        <Button onClick={handleBrowseClick} disabled={uploading}>
          {uploading ? "Processing..." : "Browse Files"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">
                  {file.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
