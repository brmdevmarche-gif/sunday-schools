/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawn, execFileSync } = require("child_process");

function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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
  } catch {
    // ignore
  }
}

function main() {
  const projectRoot = process.cwd();
  const lockPath = path.join(projectRoot, ".next", "dev", "lock");

  if (process.platform === "win32") {
    killNextDevForThisProjectWin32(projectRoot);
  }

  // Remove stale lock (if previous process crashed)
  safeUnlink(lockPath);

  const nextBin = path.join(projectRoot, "node_modules", ".bin", "next");

  const args = ["dev", "--disable-source-maps"];
  const child = spawn(nextBin, args, {
    stdio: "inherit",
    shell: process.platform === "win32", // needed for .cmd on Windows
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main();


