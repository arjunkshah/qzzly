import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface FilesComponentProps {
  sessionId: string;
  files: any[];
  onFileAdded: (file: any) => void;
}

export function FilesComponent({ sessionId, files, onFileAdded }: FilesComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n\n";
    }
    return text;
  }

  async function generateMockFlashcards(pdfText: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        front: "What is the main topic of this document?",
        back: "The document covers various educational concepts and study materials."
      },
      {
        front: "What are the key learning objectives?",
        back: "Understanding core concepts, improving retention, and applying knowledge."
      },
      {
        front: "How can you best study this material?",
        back: "Review regularly, practice with quizzes, and create your own examples."
      },
      {
        front: "What is the most effective study technique mentioned?",
        back: "Active recall and spaced repetition are the most effective techniques."
      },
      {
        front: "Why is understanding better than memorization?",
        back: "Understanding allows you to apply knowledge to new situations and solve problems creatively."
      }
    ];
  }

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
      const file = fileList[0];
      if (file.type !== "application/pdf") {
        toast({ title: "Error", description: "Only PDF files are supported", variant: "destructive" });
        return;
      }
      setFileName(file.name);
      const text = await extractTextFromPDF(file);
      toast({ title: "PDF Loaded", description: `Extracted ${text.length} characters from ${file.name}` });
      
      toast({ title: "Generating Flashcards", description: "Creating sample flashcards..." });
      const flashcards = await generateMockFlashcards(text);
      setResults(flashcards);
      toast({ title: "Done!", description: "Sample flashcards generated." });
      
      // Add file to session
      onFileAdded({
        id: `${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        uploadedAt: new Date().toISOString(),
        content: text,
        flashcards,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to process PDF", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Study Materials</h2>
        <p className="text-gray-600 mb-4">Upload your PDF notes and generate sample flashcards for demonstration.</p>
        <div
          className={`upload-area rounded-lg p-8 text-center cursor-pointer mb-6 border-2 border-dashed ${isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300"}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={handleBrowseClick}
        >
          <Upload className="w-12 h-12 mx-auto text-purple-500 mb-3" />
          <p className="text-gray-600 mb-2">Drag & drop your PDF files here</p>
          <p className="text-gray-400 text-sm">or</p>
          <Button variant="outline" className="mt-2 border-purple-300 text-purple-600 hover:bg-purple-50">Browse files</Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            multiple={false}
            onChange={e => { if (e.target.files && e.target.files.length > 0) handleFileUpload(e.target.files); }}
          />
        </div>
        {uploading && <div className="text-purple-600">Processing...</div>}
        {results && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Sample Flashcards Generated</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              {results.map((flashcard: any, index: number) => (
                <div key={index} className="mb-4 p-3 bg-white rounded border">
                  <div className="font-semibold text-purple-600 mb-1">Question {index + 1}:</div>
                  <div className="mb-2">{flashcard.front}</div>
                  <div className="font-semibold text-green-600 mb-1">Answer:</div>
                  <div>{flashcard.back}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
