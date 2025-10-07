import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Upload, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CompleteTaskDialog } from "./CompleteTaskDialog";

interface Task {
  id: string;
  task_number: number;
  title: string;
  description: string;
  deadline: string;
  status: string;
  created_at: string;
  assigned_to: string;
}

interface UserTaskListProps {
  filter: "all" | "pending" | "completed";
}

export function UserTaskList({ filter }: UserTaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    loadTasks();

    // Subscribe to task changes
    const channel = supabase
      .channel("user-tasks-changes")
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
  }, [filter]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      
      let query = supabase
        .from("tasks")
        .select("*")
        .lte("start_date", now)
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.in("status", ["pending", "awaiting_approval", "rejected"]);
      } else if (filter === "completed") {
        query = query.eq("status", "completed");
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

  const handleMarkComplete = (task: Task) => {
    setSelectedTask(task);
    setCompleteDialogOpen(true);
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

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
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
        {tasks.map((task) => {
          const overdue = isOverdue(task.deadline) && task.status === "pending";

          return (
            <Card
              key={task.id}
              className={`p-6 hover:shadow-md transition-smooth ${
                overdue ? "border-destructive/50" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="font-mono">
                      #{task.task_number}
                    </Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{task.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className={`w-4 h-4 ${overdue ? "text-destructive" : "text-muted-foreground"}`} />
                        <span className={overdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {overdue ? "Overdue: " : "Due: "}
                          {format(new Date(task.deadline), "MMM dd, yyyy 'at' hh:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  {getStatusBadge(task.status)}
                  {(task.status === "pending" || task.status === "rejected") && 
                   task.assigned_to === currentUserId && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkComplete(task)}
                      className="gradient-secondary hover:opacity-90"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedTask && (
        <CompleteTaskDialog
          task={selectedTask}
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          onComplete={() => {
            loadTasks();
            setCompleteDialogOpen(false);
          }}
        />
      )}
    </>
  );
}