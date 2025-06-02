import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileItem } from "@/types/session";
import { addFileToSession } from "@/services/sessionService";
import { generateWithGemini } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";
import { File, Upload, Download, Trash, FileText } from "lucide-react";

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
      const prompt = `Please provide a concise summary of the following document content. Focus on the main topics, key concepts, and what a student could learn from this material:

Document: ${fileName}
Content: ${fileContent.substring(0, 3000)}...`;
      
      const summary = await generateWithGemini(prompt, { temperature: 0.3, maxOutputTokens: 200 });
      return summary;
    } catch (error) {
      console.error("Error generating file summary:", error);
      return "Unable to generate summary - file content may not be accessible to AI.";
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Import pdfjs-dist dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set up the worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      console.log(`Extracted ${fullText.length} characters from ${file.name}`);
      return fullText.trim();
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      
      // Fallback to a more descriptive placeholder that indicates the issue
      return `Failed to extract text from ${file.name}. Error: ${error instanceof Error ? error.message : 'Unknown error'}. This is a ${(file.size / 1024).toFixed(1)}KB PDF file that could not be processed for text extraction.`;
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
        
        // Extract text content from PDF
        const extractedContent = await extractTextFromPDF(file);
        console.log("Extracted content preview:", extractedContent.substring(0, 200) + "...");
        
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
        
        // Generate summary to test AI access
        setGeneratingSummaries(prev => [...prev, newFile.id]);
        
        try {
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
          Upload your PDF notes and study materials for AI analysis. We'll extract the actual text content and generate a summary.
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
                            View extracted content (for debugging)
                          </summary>
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 max-h-32 overflow-y-auto">
                            {file.content.substring(0, 500)}...
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
