import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileItem } from "@/types/session";
import { addFileToSession, getFileSummaries, removeFileFromSession } from "@/services/sessionService";
import { useToast } from "@/hooks/use-toast";
import { FileIcon, TrashIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { extractTextFromPDF, chunkText } from '@/lib/utils';

interface FilesComponentProps {
  sessionId: string;
  files: FileItem[];
  onFileAdded: (file: FileItem) => void;
  onFileRemoved: (fileId: string) => void;
}

export function FilesComponent({ sessionId, files, onFileAdded, onFileRemoved }: FilesComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileSummaries, setFileSummaries] = useState<Record<string, any>>({});
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load file summaries when component mounts or files change
  useEffect(() => {
    if (sessionId && files.length > 0) {
      loadFileSummaries();
    }
  }, [sessionId, files]);

  const loadFileSummaries = async () => {
    try {
      const summaries = await getFileSummaries(sessionId);
      setFileSummaries(summaries);
    } catch (error) {
      console.error("Error loading file summaries:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await handleFiles(droppedFiles);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      await handleFiles(selectedFiles);
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.type !== 'application/pdf') {
          toast({
          title: "Invalid file type",
          description: "Please upload PDF files only.",
          variant: "destructive"
          });
          continue;
        }
        
      const fileId = `file_${Date.now()}`;
      setProcessingFiles(prev => new Set(prev).add(fileId));

        try {
        // Create a blob URL for the file
        const blobUrl = URL.createObjectURL(file);
        console.log(`Created blob URL for ${file.name}: ${blobUrl}`);
          
        // Extract text from PDF
        const fullText = await extractTextFromPDF(file);
        // Chunk the text for large files
        const textChunks = chunkText(fullText, 4000); // 4000 chars per chunk

        // Read the file content as base64 (for Gemini inline_data if needed)
        const arrayBuffer = await file.arrayBuffer();
        const base64Content = btoa(
          new Uint8Array(arrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Create file object with content and text chunks
          const newFile: FileItem = {
          id: fileId,
            name: file.name,
          url: blobUrl,
            type: file.type,
          uploadedAt: new Date().toISOString(),
          content: base64Content,
          // @ts-ignore
          textChunks: textChunks, // Add textChunks for later Gemini processing
          extractedText: fullText // Store full extracted text for summary
          };
          
          // Add file to session
        await addFileToSession(sessionId, newFile);

        // Create a file object without content for the UI
        const fileForUI = {
          ...newFile,
          content: undefined,
          textChunks: undefined
        };

        onFileAdded(fileForUI);
          
          console.log(`File ${file.name} added successfully`);
          
        // Wait a bit for processing to complete, then reload summaries
        setTimeout(() => {
          loadFileSummaries();
          setProcessingFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(fileId);
            return newSet;
          });
        }, 3000);

      } catch (error) {
        console.error('Error adding file:', error);
        setProcessingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
          toast({
            title: "Error",
          description: `Failed to add ${file.name}. Please try again.`,
          variant: "destructive"
          });
        }
      }
  };

  const handleRemoveFile = async (fileId: string) => {
    try {
      await removeFileFromSession(sessionId, fileId);
      onFileRemoved(fileId);
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Error",
        description: `Failed to remove ${fileId}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const openSummary = (fileId: string) => {
    setSelectedFileId(fileId);
    setShowSummaryDialog(true);
  };

  const viewFile = (file: FileItem) => {
    if (file.url && file.url.startsWith('blob:')) {
      // Open the blob URL in a new tab
      window.open(file.url, '_blank');
    } else {
      toast({
        title: "Error",
        description: "File not available for viewing",
        variant: "destructive"
      });
    }
  };

  const selectedFile = files.find(f => f.id === selectedFileId);
  const selectedSummary = selectedFileId ? fileSummaries[selectedFileId] : null;

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
          <input
            type="file"
            ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf"
            className="hidden"
            multiple
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="mb-2"
        >
          <FileIcon className="mr-2 h-4 w-4" />
          Upload PDF
        </Button>
        <p className="text-sm text-muted-foreground">
          Drag and drop PDF files here, or click to select files
        </p>
        </div>
        
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploaded Files</h3>
            {files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.name}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      {processingFiles.has(file.id) && (
                        <Badge variant="secondary" className="text-xs">
                          Processing...
                        </Badge>
                      )}
                      {fileSummaries[file.id] && (
                        <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => openSummary(file.id)}>
                          Summary Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => viewFile(file)}
                    title="View PDF"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {fileSummaries[file.id] && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                      onClick={() => openSummary(file.id)}
                      title="View Summary"
                      >
                      <EyeOpenIcon className="h-4 w-4" />
                      </Button>
                  )}
                      <Button
                        variant="ghost"
                        size="icon"
                    onClick={() => handleRemoveFile(file.id)}
                    title="Remove File"
                      >
                    <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
              </Card>
            ))}
          </div>
        )}

      {/* File Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name} - Summary</DialogTitle>
            <DialogDescription>
              AI-generated summary and key topics from this document
            </DialogDescription>
          </DialogHeader>

          {selectedSummary ? (
            <div className="space-y-4 mt-4">
                          <div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm whitespace-pre-line leading-relaxed">{selectedSummary.summary}</div>
                      </div>
                    </div>
                    
              {selectedSummary.topics && selectedSummary.topics.length > 0 && (
                      <div>
                  <h4 className="text-sm font-semibold mb-2">Key Topics:</h4>
                        <div className="flex flex-wrap gap-2">
                    {selectedSummary.topics.map((topic: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No summary available for this file yet.</p>
                  </div>
                )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
