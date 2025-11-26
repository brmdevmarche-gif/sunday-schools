import { NotFoundError } from "@/components/ui/error-display";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <NotFoundError
        title="Page Not Found"
        description="The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL."
        action={{
          label: "Go Home",
          onClick: () => (window.location.href = "/admin"),
        }}
        secondaryAction={{
          label: "Go Back",
          onClick: () => window.history.back(),
        }}
        showBackButton={true}
      />
    </div>
  );
}
