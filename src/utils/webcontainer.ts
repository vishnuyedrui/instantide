import { WebContainer, FileSystemTree } from "@webcontainer/api";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export type ContainerStatus = 
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "running"
  | "ready"
  | "error";

export interface ContainerCallbacks {
  onStatusChange?: (status: ContainerStatus) => void;
  onOutput?: (data: string) => void;
  onServerReady?: (url: string) => void;
  onError?: (error: string) => void;
}

export async function bootWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }
  
  if (bootPromise) {
    return bootPromise;
  }
  
  bootPromise = WebContainer.boot();
  webcontainerInstance = await bootPromise;
  
  return webcontainerInstance;
}

export async function mountFiles(
  container: WebContainer,
  files: FileSystemTree
): Promise<void> {
  await container.mount(files);
}

export async function runCommand(
  container: WebContainer,
  command: string,
  args: string[],
  onOutput?: (data: string) => void
): Promise<number> {
  const process = await container.spawn(command, args);
  
  process.output.pipeTo(
    new WritableStream({
      write(data) {
        onOutput?.(data);
      },
    })
  );
  
  return process.exit;
}

export async function startDevServer(
  container: WebContainer,
  callbacks: ContainerCallbacks
): Promise<void> {
  const { onStatusChange, onOutput, onServerReady, onError } = callbacks;
  
  try {
    // Install dependencies
    onStatusChange?.("installing");
    onOutput?.("\x1b[36m➜ Running npm install...\x1b[0m\n\n");
    
    const installExitCode = await runCommand(
      container,
      "npm",
      ["install"],
      onOutput
    );
    
    if (installExitCode !== 0) {
      onError?.("npm install failed. Check the terminal output for details.");
      onStatusChange?.("error");
      return;
    }
    
    onOutput?.("\n\x1b[32m✓ Dependencies installed successfully!\x1b[0m\n\n");
    
    // Start dev server
    onStatusChange?.("running");
    onOutput?.("\x1b[36m➜ Starting development server...\x1b[0m\n\n");
    
    const serverProcess = await container.spawn("npm", ["run", "dev"]);
    
    serverProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput?.(data);
        },
      })
    );
    
    // Listen for server ready
    container.on("server-ready", (port, url) => {
      onOutput?.(`\n\x1b[32m✓ Server ready on port ${port}\x1b[0m\n`);
      onServerReady?.(url);
      onStatusChange?.("ready");
    });
    
    // Handle server exit
    serverProcess.exit.then((code) => {
      if (code !== 0) {
        onError?.(`Dev server exited with code ${code}`);
        onStatusChange?.("error");
      }
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    onError?.(message);
    onStatusChange?.("error");
  }
}

export async function runFullWorkflow(
  files: FileSystemTree,
  callbacks: ContainerCallbacks
): Promise<void> {
  const { onStatusChange, onOutput, onError } = callbacks;
  
  try {
    // Boot
    onStatusChange?.("booting");
    onOutput?.("\x1b[36m➜ Booting WebContainer...\x1b[0m\n");
    
    const container = await bootWebContainer();
    onOutput?.("\x1b[32m✓ WebContainer booted!\x1b[0m\n\n");
    
    // Mount
    onStatusChange?.("mounting");
    onOutput?.("\x1b[36m➜ Mounting files...\x1b[0m\n");
    
    await mountFiles(container, files);
    onOutput?.("\x1b[32m✓ Files mounted!\x1b[0m\n\n");
    
    // Start server
    await startDevServer(container, callbacks);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    onError?.(message);
    onStatusChange?.("error");
  }
}

export function teardownWebContainer(): void {
  if (webcontainerInstance) {
    webcontainerInstance.teardown();
    webcontainerInstance = null;
    bootPromise = null;
  }
}
