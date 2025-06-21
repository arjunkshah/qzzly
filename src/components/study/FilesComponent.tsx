import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileItem } from "@/types/session";
import { addFileToSession } from "@/services/sessionService";
import { generateFileSummary as openaiGenerateFileSummary } from "@/services/openaiService";
import { useToast } from "@/hooks/use-toast";
import { File, Upload, Download, Trash, FileText, AlertCircle } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { extractTextFromPDF, validatePDFExtraction } from "@/lib/utils";

interface FilesComponentProps {
  sessionId: string;
  files: FileItem[];
  onFileAdded: (file: FileItem) => void;
}

export function FilesComponent({ sessionId, files, onFileAdded }: FilesComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingSummaries, setGeneratingSummaries] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateFileSummary = async (fileName: string, fileContent: string): Promise<string> => {
    try {
      return await openaiGenerateFileSummary(fileName, fileContent, sessionId);
    } catch (error) {
      console.error("Error generating file summary:", error);
      return "Unable to generate summary - AI processing error occurred.";
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // First validate the PDF extraction
      const validation = await validatePDFExtraction(file);
      
      if (!validation.success) {
        console.warn("PDF validation failed:", validation.issues);
        return validation.sample || `Failed to extract text from ${file.name}. ${validation.issues.join(', ')}`;
      }
      
      // Log validation results for debugging
      console.log(`PDF validation results for ${file.name}:`, {
        quality: validation.quality,
        textLength: validation.textLength,
        pagesExtracted: validation.pagesExtracted,
        issues: validation.issues
      });
      
      // Extract the actual text
      const extractedContent = await extractTextFromPDF(file);
      
      // Provide user feedback based on quality
      if (validation.quality === 'poor') {
        toast({
          title: "Warning",
          description: `PDF extraction quality is poor. ${validation.issues.join(', ')}`,
          variant: "destructive",
        });
      } else if (validation.quality === 'fair') {
        toast({
          title: "Notice",
          description: "PDF extraction quality is fair. Some content may be missing.",
        });
      }
      
      return extractedContent;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      return `Failed to extract text from ${file.name}. Error: ${error instanceof Error ? error.message : 'Unknown error'}. File size: ${(file.size / 1024).toFixed(1)}KB. This may be an encrypted, corrupted, or image-only PDF.`;
    }
  };

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
        
        console.log(`Processing file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
        
        // Extract text content from PDF
        const extractedContent = await extractTextFromPDF(file);
        console.log("Extracted content length:", extractedContent.length);
        
        const newFile: FileItem = {
          id: `file_${Date.now()}_${i}`,
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          uploadedAt: new Date().toISOString(),
          content: extractedContent
        };
        
        await addFileToSession(sessionId, newFile);
        onFileAdded(newFile);
        
        // Generate summary
        setGeneratingSummaries(prev => [...prev, newFile.id]);
        
        try {
          console.log(`Generating summary for ${file.name} with ${extractedContent.length} characters`);
          const summary = await generateFileSummary(file.name, extractedContent);
          console.log("Generated summary:", summary);
          
          // Update the file with the summary
          const updatedFile = { ...newFile, summary };
          onFileAdded(updatedFile);
          
          toast({
            title: "File uploaded and analyzed",
            description: `${file.name} has been uploaded and summarized successfully.`
          });
        } catch (summaryError) {
          console.error("Summary generation failed:", summaryError);
          toast({
            title: "File uploaded",
            description: `${file.name} uploaded but summary generation failed.`
          });
        } finally {
          setGeneratingSummaries(prev => prev.filter(id => id !== newFile.id));
        }
      }
    } catch (error) {
      console.error("File upload error:", error);
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
          Upload your PDF notes and study materials for AI analysis. We'll extract the text content and generate summaries.
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
            <span>Uploading and analyzing files...</span>
          </div>
        )}
        
        {/* File list */}
        {files.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 p-3 rounded-lg flex-shrink-0">
                      <File className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate" title={file.name}>
                            {file.name}
                          </h3>
                          <p className="text-gray-500 text-xs">
                            Uploaded {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
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
                      
                      {/* AI Summary Section */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">AI Summary</span>
                        </div>
                        
                        {generatingSummaries.includes(file.id) ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500"></div>
                            <span>Generating summary...</span>
                          </div>
                        ) : file.summary ? (
                          <p className="text-sm text-gray-700">{file.summary}</p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No summary available</p>
                        )}
                      </div>
                      
                      {/* Content Preview (for debugging) */}
                      {file.content && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            View extracted content ({file.content.length} characters)
                          </summary>
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 max-h-32 overflow-y-auto">
                            {file.content.substring(0, 1000)}{file.content.length > 1000 ? "..." : ""}
                          </div>
                        </details>
                      )}
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
