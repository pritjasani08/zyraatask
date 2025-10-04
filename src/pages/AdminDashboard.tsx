import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { CreateTaskDialog } from "@/components/admin/CreateTaskDialog";
import { TaskList } from "@/components/admin/TaskList";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/admin/login");
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "Admin credentials required",
        });
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setUsername(profileData.username);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar username={username} role="admin" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, tasks, and track team progress
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setCreateUserOpen(true)}
              className="gradient-secondary hover:opacity-90 transition-smooth"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
            <Button
              onClick={() => setCreateTaskOpen(true)}
              className="gradient-primary hover:opacity-90 transition-smooth"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="awaiting">Awaiting Approval</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <TaskList status="all" />
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <TaskList status="pending" />
          </TabsContent>

          <TabsContent value="awaiting" className="space-y-4">
            <TaskList status="awaiting_approval" />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <TaskList status="completed" />
          </TabsContent>
        </Tabs>
      </div>

      <CreateUserDialog open={createUserOpen} onOpenChange={setCreateUserOpen} />
      <CreateTaskDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
    </div>
  );
};

export default AdminDashboard;