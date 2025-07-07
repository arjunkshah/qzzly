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

  async function generateFlashcards(pdfText: string, apiKey: string, model = "gpt-4-turbo") {
    const prompt = `You are an expert study assistant. Read the following document and generate a set of flashcards (question and answer pairs) that help a student learn the key concepts. Format as JSON: [ {"question": "...", "answer": "..."}, ... ] Document: ${pdfText}`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a helpful assistant for creating study materials." },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });
    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
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
      // Get API key from env or prompt user
      let apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        apiKey = prompt("Enter your OpenAI API key:") || "";
      }
      if (!apiKey) {
        toast({ title: "API Key Required", description: "OpenAI API key is required to generate flashcards.", variant: "destructive" });
        return;
      }
      toast({ title: "Generating Flashcards", description: "Sending to OpenAI..." });
      const flashcards = await generateFlashcards(text, apiKey);
      setResults(flashcards);
      toast({ title: "Done!", description: "Flashcards generated." });
      // Optionally, call onFileAdded to save to session
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
        <p className="text-gray-600 mb-4">Upload your PDF notes and generate flashcards instantly with AI.</p>
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
            <h3 className="text-lg font-bold mb-2">Generated Flashcards</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">{typeof results === 'string' ? results : JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
