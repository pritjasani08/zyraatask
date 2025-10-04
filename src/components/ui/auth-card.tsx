import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <Card className={cn(
        "w-full max-w-md p-8 gradient-card border-primary/10",
        "shadow-lg backdrop-blur-sm",
        className
      )}>
        {children}
      </Card>
    </div>
  );
}