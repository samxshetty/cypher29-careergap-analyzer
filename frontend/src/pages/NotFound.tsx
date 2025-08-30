import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-background flex flex-col">
      {/* Theme toggle in top corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="card-elevated max-w-md w-full text-center">
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-danger" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">404</h1>
              <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
              <p className="text-muted-foreground">
                Oops! The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            <Button asChild className="w-full">
              <a href="/">
                <Home className="w-4 h-4 mr-2" />
                Return to Career Gap Analyzer
              </a>
            </Button>

            <p className="text-xs text-muted-foreground">
              Built with ❤️ by <span className="font-semibold text-primary">Team Cypher29</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
