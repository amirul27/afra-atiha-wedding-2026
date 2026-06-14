import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Heart className="mb-4 h-10 w-10 fill-current text-marigold-400" />
      <h1 className="font-display text-4xl font-semibold text-plum-700">Page not found</h1>
      <p className="mt-2 text-muted-foreground">That page wandered off to the dance floor.</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
