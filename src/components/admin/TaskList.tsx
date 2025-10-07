import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ViewProofDialog } from "./ViewProofDialog";

interface Task {
  id: string;
  task_number: number;
  title: string;
  description: string;
  deadline: string;
  status: string;
  created_at: string;
  assigned_to_profile?: {
    username: string;
  };
}

interface TaskListProps {
  status: "all" | "pending" | "awaiting_approval" | "completed";
}

export function TaskList({ status }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewProofTask, setViewProofTask] = useState<{ id: string; number: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();

    // Subscribe to task changes
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status]);

  const loadTasks = async () => {
    try {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(username)
        `)
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading tasks",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId: string, taskNumber: number) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Task approved",
        description: `Task #${taskNumber} has been marked as completed.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error approving task",
        description: error.message,
      });
    }
  };

  const handleReject = async (taskId: string, taskNumber: number) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "pending" })
        .eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Task rejected",
        description: `Task #${taskNumber} has been sent back for revision.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error rejecting task",
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { color: "bg-warning/20 text-warning border-warning/30", label: "Pending" },
      awaiting_approval: { color: "bg-accent/20 text-accent border-accent/30", label: "Awaiting Approval" },
      completed: { color: "bg-success/20 text-success border-success/30", label: "Completed" },
      rejected: { color: "bg-destructive/20 text-destructive border-destructive/30", label: "Rejected" },
    };

    const variant = variants[status as keyof typeof variants] || variants.pending;
    return (
      <Badge className={`${variant.color} border`}>
        {variant.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No tasks found</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => (
        <Card key={task.id} className="p-6 hover:shadow-md transition-smooth">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="font-mono">
                  #{task.task_number}
                </Badge>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{task.description}</p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Assigned to:{" "}
                      <span className="font-medium text-foreground">
                        {task.assigned_to_profile?.username || "Unknown"}
                      </span>
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {format(new Date(task.deadline), "MMM dd, yyyy 'at' hh:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              {getStatusBadge(task.status)}
              {(task.status === "awaiting_approval" || task.status === "completed") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setViewProofTask({ id: task.id, number: task.task_number })}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Proof
                </Button>
              )}
              {task.status === "awaiting_approval" && (
                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(task.id, task.task_number)}
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(task.id, task.task_number)}
                    className="flex-1 gradient-secondary hover:opacity-90"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
        ))}
      </div>

      {viewProofTask && (
        <ViewProofDialog
          taskId={viewProofTask.id}
          taskNumber={viewProofTask.number}
          open={!!viewProofTask}
          onOpenChange={(open) => !open && setViewProofTask(null)}
        />
      )}
    </>
  );
}