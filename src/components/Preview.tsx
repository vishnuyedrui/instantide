import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ExternalLink, Loader2, Monitor, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Preview() {
  const { previewUrl, containerStatus } = useWorkspaceStore();
  const [key, setKey] = useState(0);

  const isLoading = ["booting", "mounting", "installing", "running"].includes(containerStatus);
  const hasError = containerStatus === "error";

  const handleRefresh = () => {
    setKey((k) => k + 1);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Preview
          </span>
          {containerStatus === "ready" && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {previewUrl && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background/50">
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-sm font-medium">
              {containerStatus === "booting" && "Booting WebContainer..."}
              {containerStatus === "mounting" && "Mounting files..."}
              {containerStatus === "installing" && "Installing dependencies..."}
              {containerStatus === "running" && "Starting dev server..."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a moment
            </p>
          </div>
        )}

        {hasError && !previewUrl && (
          <div className="h-full flex flex-col items-center justify-center text-destructive">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
              <span className="text-2xl">!</span>
            </div>
            <p className="text-sm font-medium">Failed to start preview</p>
            <p className="text-xs text-muted-foreground mt-1">
              Check the terminal for details
            </p>
          </div>
        )}

        {previewUrl && (
          <iframe
            key={key}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        )}

        {containerStatus === "idle" && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Monitor className="w-12 h-12 opacity-20 mb-4" />
            <p className="text-sm">Preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
