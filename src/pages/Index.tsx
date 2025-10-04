import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Users, CheckCircle, Clock, Bell } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-white">T</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            TaskSync
          </h1>
          <p className="text-xl text-white/90 mb-2">by Zyraa</p>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Modern task management platform for teams
          </p>
        </div>

        {/* Login Options */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-smooth">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Admin Portal</h2>
            <p className="text-white/70 mb-6">
              Manage users, create tasks, and track team progress
            </p>
            <Button
              onClick={() => navigate("/admin/login")}
              className="w-full bg-white text-primary hover:bg-white/90"
              size="lg"
            >
              Admin Login
            </Button>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-smooth">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Team Access</h2>
            <p className="text-white/70 mb-6">
              View tasks, upload screenshots, and track deadlines
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-white text-secondary hover:bg-white/90"
              size="lg"
            >
              Team Login
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Everything you need to manage tasks
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-white mb-2">Task Management</h4>
              <p className="text-white/70 text-sm">
                Create, assign, and track tasks with ease
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-white mb-2">Deadline Tracking</h4>
              <p className="text-white/70 text-sm">
                Never miss a deadline with automatic reminders
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-white mb-2">Smart Notifications</h4>
              <p className="text-white/70 text-sm">
                Stay updated with real-time task notifications
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;