import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

interface Task {
  id: string;
  task_number: number;
  title: string;
}

interface CompleteTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function CompleteTaskDialog({
  task,
  open,
  onOpenChange,
  onComplete,
}: CompleteTaskDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      // Validate file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
        });
        continue;
      }

      // Validate file type (images and videos)
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: `${file.name} must be an image or video`,
        });
        continue;
      }

      validFiles.push(file);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please upload at least one proof file (photo or video)",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload all files to storage
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${task.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("task-screenshots")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Save screenshot reference
        const { error: dbError } = await supabase
          .from("task_screenshots")
          .insert({
            task_id: task.id,
            user_id: user.id,
            file_path: fileName,
          });

        if (dbError) throw dbError;

        return fileName;
      });

      await Promise.all(uploadPromises);

      // Update task status
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "awaiting_approval" })
        .eq("id", task.id);

      if (taskError) throw taskError;

      toast({
        title: "Task submitted for approval",
        description: `${files.length} file(s) uploaded successfully`,
      });

      setFiles([]);
      onComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Task #{task.task_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Task: {task.title}</Label>
            <p className="text-sm text-muted-foreground">
              Upload a screenshot to mark this task as complete
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof">Upload Proof (Photos/Videos)</Label>
            <Input
              id="proof"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              You can upload multiple photos and videos (max 10MB each)
            </p>
            
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">Selected files ({files.length}):</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                    >
                      <span className="truncate flex-1">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                        className="h-6 w-6 p-0 ml-2"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || files.length === 0}
              className="flex-1 gradient-primary hover:opacity-90"
            >
              {uploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit {files.length > 0 && `(${files.length})`}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}