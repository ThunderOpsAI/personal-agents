import { NextResponse } from "next/server";
import { execFile, execFileSync, spawn } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";

function resolveStockDir(): string {
  if (process.env.STOCK_EXCHANGE_DIR) {
    return path.resolve(process.env.STOCK_EXCHANGE_DIR);
  }
  const cwd = process.cwd();
  const c1 = path.resolve(cwd, "../stock-exchange");
  if (fs.existsSync(c1)) return c1;
  const c2 = path.resolve(cwd, "../../stock-exchange");
  if (fs.existsSync(c2)) return c2;
  const c3 = "/Users/thunderopsai/Documents/Workspace/01_Projects/stock-exchange";
  if (fs.existsSync(c3)) return c3;
  return c1;
}

function resolvePython(stockDir: string): string | null {
  const venvPython = path.join(stockDir, ".venv/bin/python");
  if (fs.existsSync(venvPython)) return venvPython;

  const venvPython3 = path.join(stockDir, ".venv/bin/python3");
  if (fs.existsSync(venvPython3)) return venvPython3;

  try {
    execFileSync("python3", ["--version"], { stdio: "ignore" });
    return "python3";
  } catch {
    return null;
  }
}

function resolveStreamlit(stockDir: string): string | null {
  const venvStreamlit = path.join(stockDir, ".venv/bin/streamlit");
  if (fs.existsSync(venvStreamlit)) return venvStreamlit;

  try {
    execFileSync("streamlit", ["--version"], { stdio: "ignore" });
    return "streamlit";
  } catch {
    return null;
  }
}

function checkPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || "run-once";
    const profile = (body.profile || "core").toLowerCase() === "aggressive" ? "aggressive" : "core";
    const universe = body.universe;

    const stockDir = resolveStockDir();
    const pythonBin = resolvePython(stockDir);

    // Guard: Check if running on Vercel or environment without local venv / project
    if (!fs.existsSync(stockDir) || !pythonBin) {
      return NextResponse.json(
        { error: "Local execution required to run trading cycle or Streamlit daemon. Viewing synced snapshot." },
        { status: 501 }
      );
    }

    if (action === "open-streamlit") {
      const isListening = await checkPortListening(8501);
      if (!isListening) {
        const streamlitBin = resolveStreamlit(stockDir);
        const scriptPath = path.join(stockDir, "src/observability/dashboard.py");
        if (!streamlitBin) {
          return NextResponse.json(
            { error: "Streamlit binary not found in local environment or venv." },
            { status: 500 }
          );
        }

        const child = spawn(
          streamlitBin,
          ["run", scriptPath, "--server.port", "8501", "--server.headless", "true"],
          {
            cwd: stockDir,
            detached: true,
            stdio: "ignore",
            env: { ...process.env, PYTHONPATH: stockDir },
          }
        );
        child.unref();

        // Brief delay to allow daemon startup
        await new Promise((r) => setTimeout(r, 1200));
      }

      return NextResponse.json({
        status: "ok",
        url: "http://localhost:8501",
        already_running: isListening,
      });
    }

    // Trading desk / Backtest actions
    const cliArgs: string[] = ["src/main.py"];
    if (action === "run-once") {
      cliArgs.push("--run-once", "--profile", profile);
      if (universe) {
        cliArgs.push("--universe", universe);
      }
    } else if (action === "backtest-tier1") {
      cliArgs.push("--backtest-tier1");
    } else if (action === "backtest-tier2") {
      cliArgs.push("--backtest-tier2");
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const execPromise = new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
      execFile(
        pythonBin,
        cliArgs,
        {
          cwd: stockDir,
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, PYTHONPATH: stockDir },
        },
        (error, stdout, stderr) => {
          const exitCode = error ? (error as any).code ?? 1 : 0;
          resolve({
            stdout: stdout || "",
            stderr: stderr || (error ? error.message : ""),
            exitCode,
          });
        }
      );
    });

    const execResult = await execPromise;

    // Refresh synced snapshot after execution
    let updatedState: any = null;
    const scriptPath = path.resolve(
      process.cwd(),
      fs.existsSync(path.resolve(process.cwd(), "lib/stock-exchange.py"))
        ? "lib/stock-exchange.py"
        : "dashboard/lib/stock-exchange.py"
    );

    if (fs.existsSync(scriptPath)) {
      try {
        const stdout = execFileSync(
          pythonBin,
          [scriptPath, "--profile", profile, "--stock-dir", stockDir],
          { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
        );
        updatedState = JSON.parse(stdout);

        const allStdout = execFileSync(
          pythonBin,
          [scriptPath, "--all", "--stock-dir", stockDir],
          { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
        );
        const snapshotFile = path.resolve(
          process.cwd(),
          fs.existsSync(path.resolve(process.cwd(), "data"))
            ? "data/stock_exchange_snapshot.json"
            : "dashboard/data/stock_exchange_snapshot.json"
        );
        fs.mkdirSync(path.dirname(snapshotFile), { recursive: true });
        fs.writeFileSync(snapshotFile, allStdout, "utf-8");
      } catch (syncErr) {
        console.warn("[stock-exchange/run] Failed to refresh snapshot after run:", syncErr);
      }
    }

    return NextResponse.json({
      status: execResult.exitCode === 0 ? "success" : "failed",
      action,
      profile,
      exitCode: execResult.exitCode,
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      state: updatedState,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to execute stock exchange cycle" },
      { status: 500 }
    );
  }
}
