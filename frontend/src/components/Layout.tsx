import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              Mahima Pareek
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link to="/blog">
                <Button variant="ghost">Blog</Button>
              </Link>
              <Link to="/question-papers">
                <Button variant="ghost">Question Papers</Button>
              </Link>
              <Link to="/answer-papers">
                <Button variant="ghost">My Answers</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">
            © {new Date().getFullYear()} Mahima Pareek. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

