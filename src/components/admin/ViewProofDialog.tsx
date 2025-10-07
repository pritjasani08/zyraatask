import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ViewProofDialogProps {
  taskId: string;
  taskNumber: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Screenshot {
  id: string;
  file_path: string;
  uploaded_at: string;
}

export function ViewProofDialog({
  taskId,
  taskNumber,
  open,
  onOpenChange,
}: ViewProofDialogProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [urls, setUrls] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadScreenshots();
    }
  }, [open, taskId]);

  const loadScreenshots = async () => {
    setLoading(true);
    try {
      // Fetch screenshot records
      const { data, error } = await supabase
        .from("task_screenshots")
        .select("*")
        .eq("task_id", taskId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      setScreenshots(data || []);

      // Generate signed URLs for each file
      const urlPromises = (data || []).map(async (screenshot) => {
        const { data: urlData, error: urlError } = await supabase.storage
          .from("task-screenshots")
          .createSignedUrl(screenshot.file_path, 3600); // 1 hour expiry

        if (urlError) {
          console.error("Error generating URL:", urlError);
          return null;
        }

        return { id: screenshot.id, url: urlData.signedUrl };
      });

      const urlResults = await Promise.all(urlPromises);
      const urlMap: { [key: string]: string } = {};
      urlResults.forEach((result) => {
        if (result) {
          urlMap[result.id] = result.url;
        }
      });

      setUrls(urlMap);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading proofs",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isVideo = (filePath: string) => {
    const ext = filePath.split(".").pop()?.toLowerCase();
    return ["mp4", "webm", "mov", "avi", "mkv"].includes(ext || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task #{taskNumber} - Uploaded Proofs</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : screenshots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No proof files uploaded yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className="space-y-2">
                <div className="rounded-lg overflow-hidden border bg-muted">
                  {urls[screenshot.id] ? (
                    isVideo(screenshot.file_path) ? (
                      <video
                        src={urls[screenshot.id]}
                        controls
                        className="w-full h-auto"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={urls[screenshot.id]}
                        alt="Task proof"
                        className="w-full h-auto object-contain"
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <p className="text-sm text-muted-foreground">
                        Unable to load file
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uploaded: {new Date(screenshot.uploaded_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
