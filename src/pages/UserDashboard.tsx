import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTaskList } from "@/components/user/UserTaskList";
import { useToast } from "@/hooks/use-toast";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAuth();
    loadUnreadNotifications();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "user")
        .single();

      if (!roleData) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "User account required",
        });
        await supabase.auth.signOut();
        navigate("/login");
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
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
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
      <Navbar username={username} role="user" unreadNotifications={unreadCount} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
          <p className="text-muted-foreground">
            Track and complete your assigned tasks
          </p>
        </div>

        <Tabs defaultValue="my-tasks" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <UserTaskList filter="all" />
          </TabsContent>

          <TabsContent value="my-tasks" className="space-y-4">
            <UserTaskList filter="pending" />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <UserTaskList filter="completed" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;