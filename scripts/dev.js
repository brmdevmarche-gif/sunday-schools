/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawn, execFileSync } = require("child_process");

function safeUnlink(filePath) {
  try {
    // On Windows, the Next dev lockfile can be held with an exclusive handle.
    // `existsSync/statSync` may throw EPERM, so just try unlink directly.
    fs.unlinkSync(filePath);
  } catch (e) {
    // ignore
  }
}

function killNextDevForThisProjectWin32(projectRoot) {
  // NOTE: This runs inside Git Bash on Windows too. Avoid relying on shell parsing.
  // Use PowerShell via execFileSync and keep commands small/robust.
  const folder = path.win32.basename(projectRoot);
  const folderEsc = folder.replace(/'/g, "''");
  const lockPath = path.join(projectRoot, ".next", "dev", "lock");
  const lockEsc = lockPath.replace(/'/g, "''");

  function ps(cmd) {
    try {
      return execFileSync("powershell.exe", ["-NoProfile", "-Command", cmd], {
        stdio: ["ignore", "pipe", "pipe"],
        encoding: "utf8",
      });
    } catch {
      return "";
    }
  }

  // 1) Kill orphaned Next `start-server.js` for this repo folder (this is what holds the lock).
  const pidsRaw = ps(
    `$ErrorActionPreference='SilentlyContinue'; ` +
      `$folder='${folderEsc}'; ` +
      `Get-CimInstance Win32_Process | ` +
      `Where-Object { $_.CommandLine -and $_.CommandLine -like ('*' + $folder + '*') -and $_.CommandLine -match 'start-server\\.js' } | ` +
      `Select-Object -ExpandProperty ProcessId`
  );
  const pids = pidsRaw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);

  for (const pid of pids) {
    ps(`$ErrorActionPreference='SilentlyContinue'; Stop-Process -Id ${pid} -Force`);
  }

  // 2) Kill whatever is listening on 3000/3001 if it looks like this repo's Next start-server.
  const portPidsRaw = ps(
    `$ErrorActionPreference='SilentlyContinue'; ` +
      `$ports=@(3000,3001); ` +
      `$folder='${folderEsc}'; ` +
      `Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ` +
      `Where-Object { $ports -contains $_.LocalPort } | ` +
      `Select-Object -ExpandProperty OwningProcess -Unique`
  );
  const portPids = portPidsRaw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);

  for (const pid of portPids) {
    const cmd = ps(
      `$ErrorActionPreference='SilentlyContinue'; ` +
        `(Get-CimInstance Win32_Process -Filter \"ProcessId=${pid}\").CommandLine`
    );
    if (cmd && cmd.includes(folder) && cmd.toLowerCase().includes("start-server.js")) {
      ps(`$ErrorActionPreference='SilentlyContinue'; Stop-Process -Id ${pid} -Force`);
    }
  }

  // 3) Remove stale lock (ignore errors; it may not exist).
  ps(`$ErrorActionPreference='SilentlyContinue'; Remove-Item -LiteralPath '${lockEsc}' -Force -ErrorAction SilentlyContinue`);
}

function main() {
  // In Git Bash / MSYS, `process.cwd()` can be a POSIX-like path (e.g. `/d/...`)
  // or a Windows drive path with forward slashes (e.g. `D:/...`).
  // Normalize to a Windows backslash path so it matches Win32 process command lines.
  let projectRoot = process.cwd();
  if (process.platform === "win32") {
    const m = projectRoot.match(/^\/([a-zA-Z])\/(.*)$/);
    if (m) {
      projectRoot = `${m[1].toUpperCase()}:\\${m[2].replace(/\//g, "\\")}`;
    }
    projectRoot = path.win32.normalize(projectRoot);
  }
  const lockPath = path.join(projectRoot, ".next", "dev", "lock");

  if (process.platform === "win32") {
    killNextDevForThisProjectWin32(projectRoot);
  }

  // Remove stale lock (if previous process crashed)
  safeUnlink(lockPath);

  // IMPORTANT (Windows + paths with spaces):
  // Spawning `node_modules/.bin/next` requires a shell (`.cmd`), which breaks easily when the
  // project path contains spaces (e.g. "New folder") and results in:
  //   'D:\brm-projects\New' is not recognized...
  // Instead, run Next's real JS CLI via Node directly (no shell parsing).
  const nextCli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const args = [nextCli, "dev", "--disable-source-maps"];

  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main();


