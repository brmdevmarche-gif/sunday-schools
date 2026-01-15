/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawn, execFileSync } = require("child_process");

function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      // On Windows, try to remove read-only flag first
      if (process.platform === "win32") {
        try {
          fs.chmodSync(filePath, 0o666);
        } catch {
          // ignore chmod errors
        }
      }
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // ignore - file might be locked by another process
  }
}

function safeUnlinkDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      // Try to remove the entire .next/dev directory if it exists
      if (process.platform === "win32") {
        try {
          // Use PowerShell to force remove the directory
          const escaped = dirPath.replace(/\\/g, "\\\\").replace(/'/g, "''");
          const script = `Remove-Item -Path '${escaped}' -Recurse -Force -ErrorAction SilentlyContinue`;
          execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
            stdio: "ignore",
          });
        } catch {
          // ignore
        }
      } else {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    }
  } catch (e) {
    // ignore
  }
}

function killNextDevForThisProjectWin32(projectRoot) {
  try {
    // Find and kill Next dev processes whose command line references this project path
    // (avoids killing other Next apps). Use execFileSync to avoid cmd/bash parsing.
    const escaped = projectRoot.replace(/\\/g, "\\\\").replace(/'/g, "''");
    const script =
      "$ErrorActionPreference='SilentlyContinue';" +
      "$root='" +
      escaped +
      "';" +
      "$procs = Get-CimInstance Win32_Process | Where-Object { " +
      "$_.CommandLine -and $_.CommandLine -match 'next(\\.cmd)?\\s+dev' -and $_.CommandLine -like ('*' + $root + '*')" +
      " };" +
      "foreach ($p in $procs) { try { Stop-Process -Id $p.ProcessId -Force } catch {} }";

    execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
      stdio: "ignore",
    });
    
    // Also kill processes using ports 3000 and 3001 (common Next.js dev ports)
    const killPortScript =
      "$ErrorActionPreference='SilentlyContinue';" +
      "$root='" +
      escaped +
      "';" +
      "$ports = @(3000, 3001);" +
      "foreach ($port in $ports) {" +
      "  $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue;" +
      "  foreach ($conn in $conns) {" +
      "    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue;" +
      "    if ($proc) {" +
      "      $cmdLine = (Get-CimInstance Win32_Process -Filter \"ProcessId = $($proc.Id)\" -ErrorAction SilentlyContinue).CommandLine;" +
      "      if ($proc.ProcessName -eq 'node' -or ($cmdLine -and $cmdLine -like ('*' + $root + '*'))) {" +
      "        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue;" +
      "      }" +
      "    }" +
      "  }" +
      "}";
    
    execFileSync("powershell.exe", ["-NoProfile", "-Command", killPortScript], {
      stdio: "ignore",
    });
  } catch {
    // ignore
  }
}

function main() {
  const projectRoot = process.cwd();
  const lockPath = path.join(projectRoot, ".next", "dev", "lock");
  const devDir = path.join(projectRoot, ".next", "dev");

  if (process.platform === "win32") {
    killNextDevForThisProjectWin32(projectRoot);
    // Give processes time to terminate before cleanup
    // Use a longer delay to ensure processes are fully killed
    setTimeout(() => {
      // Remove stale lock and dev directory (if previous process crashed)
      // Try multiple times to ensure cleanup
      for (let i = 0; i < 3; i++) {
        safeUnlink(lockPath);
        safeUnlinkDir(devDir);
        if (i < 2) {
          // Small delay between attempts using busy wait
          const start = Date.now();
          while (Date.now() - start < 500) {
            // busy wait 500ms
          }
        }
      }
      
      // Wait a bit more, then start Next.js
      setTimeout(startNextDev, 1000);
    }, 2000);
  } else {
    // Remove stale lock (if previous process crashed)
    safeUnlink(lockPath);
    startNextDev();
  }
}

function startNextDev() {
  const projectRoot = process.cwd();
  
  // Execute Next.js CLI via Node to avoid path issues with spaces
  // The next.cmd file on Windows is just a wrapper, so we execute the JS directly
  const nextCliPath = path.join(
    projectRoot,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next"
  );

  const args = ["dev", "--disable-source-maps"];
  
  // Use Node to execute Next.js CLI directly - this avoids all path parsing issues
  const child = spawn(process.execPath, [nextCliPath, ...args], {
    stdio: "inherit",
    shell: false,
    cwd: projectRoot,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main();


