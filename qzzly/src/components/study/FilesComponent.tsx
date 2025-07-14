import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFiles, uploadFile, deleteFile } from "@/services/supabaseFiles";
import { FileItem } from "@/types/session";
import { useAuth } from "@/contexts/AuthContext";

interface FilesComponentProps {
  sessionId: string;
}

export function FilesComponent({ sessionId }: FilesComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch files from Supabase
  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files", sessionId],
    queryFn: () => fetchFiles(sessionId),
    enabled: !!sessionId,
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      return await uploadFile(sessionId, user.id, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", sessionId] });
      toast({ title: "File uploaded", description: "File was uploaded successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error?.message || "There was an error uploading your file.",
        variant: "destructive",
      });
    },
    onSettled: () => setUploading(false),
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteFile(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", sessionId] });
      toast({ title: "File deleted", description: "File was deleted successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error?.message || "There was an error deleting the file.",
        variant: "destructive",
      });
    },
  });

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
    for (const file of Array.from(fileList)) {
      uploadMutation.mutate(file);
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
          {uploading ? "Uploading..." : "Browse Files"}
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

      {isLoading ? (
        <div className="mt-6 text-center text-gray-500">Loading files...</div>
      ) : files.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
          <div className="space-y-2">
            {files.map((file: FileItem) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {file.name}
                  </a>
                  <span className="ml-2 text-sm text-gray-500">{file.type}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(file.id)}
                  disabled={deleteMutation.isLoading}
                  aria-label="Delete file"
                >
                  <Trash2 className="h-5 w-5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
