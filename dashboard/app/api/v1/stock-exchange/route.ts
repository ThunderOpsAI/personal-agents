import { NextResponse } from "next/server";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

function resolveStockDir(): string {
  if (process.env.STOCK_EXCHANGE_DIR) {
    return path.resolve(process.env.STOCK_EXCHANGE_DIR);
  }
  // Try standard relative locations:
  // In dev / server, process.cwd() may be /.../personal-agents/dashboard or /.../personal-agents
  const cwd = process.cwd();
  const candidate1 = path.resolve(cwd, "../stock-exchange");
  if (fs.existsSync(candidate1)) return candidate1;

  const candidate2 = path.resolve(cwd, "../../stock-exchange");
  if (fs.existsSync(candidate2)) return candidate2;

  const candidate3 = "/Users/thunderopsai/Documents/Workspace/01_Projects/stock-exchange";
  if (fs.existsSync(candidate3)) return candidate3;

  return candidate1;
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

function getSnapshotFile(): string {
  const cwd = process.cwd();
  const p1 = path.resolve(cwd, "data/stock_exchange_snapshot.json");
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve(cwd, "dashboard/data/stock_exchange_snapshot.json");
  if (fs.existsSync(p2)) return p2;
  return p1;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const profileParam = url.searchParams.get("profile") || "core";
    const profile = profileParam.toLowerCase() === "aggressive" ? "aggressive" : "core";

    const stockDir = resolveStockDir();
    const pythonBin = resolvePython(stockDir);
    const scriptPath = path.resolve(
      process.cwd(),
      fs.existsSync(path.resolve(process.cwd(), "lib/stock-exchange.py"))
        ? "lib/stock-exchange.py"
        : "dashboard/lib/stock-exchange.py"
    );

    const snapshotPath = getSnapshotFile();

    // If stock exchange dir and python exist, run live extraction
    if (fs.existsSync(stockDir) && pythonBin && fs.existsSync(scriptPath)) {
      try {
        const stdout = execFileSync(
          pythonBin,
          [scriptPath, "--profile", profile, "--stock-dir", stockDir],
          { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
        );
        const data = JSON.parse(stdout);

        // Update snapshot file in background or synchronously for Vercel parity
        try {
          const allStdout = execFileSync(
            pythonBin,
            [scriptPath, "--all", "--stock-dir", stockDir],
            { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
          );
          if (allStdout && allStdout.trim().startsWith("{")) {
            fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
            fs.writeFileSync(snapshotPath, allStdout, "utf-8");
          }
        } catch (e) {
          console.warn("[stock-exchange] Failed to sync snapshot file:", e);
        }

        return NextResponse.json(data);
      } catch (execErr) {
        console.warn("[stock-exchange] Live extraction failed, falling back to snapshot:", execErr);
      }
    }

    // Fallback: Read from synced JSON snapshot (Vercel serverless mode)
    if (fs.existsSync(snapshotPath)) {
      try {
        const raw = fs.readFileSync(snapshotPath, "utf-8");
        const parsed = JSON.parse(raw);
        const profileData = parsed[profile] || (profile === "core" ? parsed.core : parsed.aggressive);
        if (profileData) {
          return NextResponse.json({
            ...profileData,
            is_snapshot: true,
            snapshot_timestamp: parsed.snapshot_timestamp || new Date().toISOString(),
          });
        }
      } catch (snapErr) {
        console.error("[stock-exchange] Failed to parse snapshot JSON:", snapErr);
      }
    }

    // Explicit Offline / Empty state if no data is found (Zero mock data rule)
    return NextResponse.json({
      profile,
      status: "offline",
      is_snapshot: true,
      snapshot_timestamp: null,
      halted_lock: false,
      account: {
        equity: 0,
        cash: 0,
        buying_power: 0,
        circuit_tier: 0,
        updated_at: null,
      },
      last_run: null,
      reconciliation: null,
      positions: [],
      candidates: [],
      orders: [],
      audit_logs: [],
      reports: [],
      logs: {
        daily_run: [],
        daily_run_aggressive: [],
      },
      error: "Stock Exchange database is offline or uninitialized.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err?.message || "Failed to fetch stock exchange desk state" },
      { status: 500 }
    );
  }
}
