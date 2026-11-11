#!/usr/bin/env python3
"""
Stock Exchange State Extractor
Reads real persisted SQLite and filesystem state from stock-exchange project.
Outputs sanitized JSON for Next.js API routes and Vercel snapshots.
"""

import argparse
import glob
import json
import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

def get_db_connection(db_path: Path):
    if not db_path.exists():
        return None
    try:
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        return conn
    except Exception:
        return None

def extract_profile_data(stock_dir: Path, profile: str = "core"):
    profile = (profile or "core").lower()
    db_name = "trading_aggressive.db" if profile == "aggressive" else "trading.db"
    db_path = stock_dir / "data" / db_name

    broker_name = (
        "broker_simulated_aggressive.json"
        if profile == "aggressive"
        else "broker_simulated_core.json"
    )
    broker_path = stock_dir / "data" / broker_name
    if not broker_path.exists() and profile == "core":
        alt_broker = stock_dir / "data" / "broker_simulated.json"
        if alt_broker.exists():
            broker_path = alt_broker

    broker_data = {}
    if broker_path.exists():
        try:
            with open(broker_path, "r", encoding="utf-8") as f:
                broker_data = json.load(f)
        except Exception:
            broker_data = {}

    halted_lock = (
        (stock_dir / "data" / "HALTED.lock").exists()
        or (stock_dir / "HALTED.lock").exists()
    )

    conn = get_db_connection(db_path)
    snap = None
    last_run = None
    recon = None
    positions_db = []
    candidates = []
    orders = []
    audit_logs = []

    if conn:
        cur = conn.cursor()

        def fetch_one(q, p=()):
            try:
                cur.execute(q, p)
                row = cur.fetchone()
                return dict(row) if row else None
            except Exception:
                return None

        def fetch_all(q, p=()):
            try:
                cur.execute(q, p)
                return [dict(r) for r in cur.fetchall()]
            except Exception:
                return []

        snap = fetch_one("SELECT * FROM portfolio_snapshots ORDER BY snapshot_id DESC LIMIT 1")
        last_run = fetch_one("SELECT * FROM trading_runs ORDER BY rowid DESC LIMIT 1")
        recon = fetch_one("SELECT * FROM reconciliation_events ORDER BY rowid DESC LIMIT 1")
        positions_db = fetch_all("SELECT * FROM positions WHERE status = 'OPEN'")
        candidates = fetch_all("""
            SELECT c.*, v.verdict_outcome, v.composite_score, v.risk_officer_dissent, v.hitl_status
            FROM screened_candidates c
            LEFT JOIN committee_verdicts v ON c.candidate_id = v.candidate_id
            ORDER BY c.rowid DESC LIMIT 15
        """)
        orders = fetch_all("SELECT * FROM orders ORDER BY rowid DESC LIMIT 15")
        audit_logs = fetch_all("SELECT * FROM system_audit_logs ORDER BY log_id DESC LIMIT 20")
        conn.close()

    # Positions resolution: broker state positions if active, else DB positions
    positions = []
    if broker_data.get("positions"):
        raw_pos = broker_data["positions"]
        if isinstance(raw_pos, dict):
            positions = list(raw_pos.values())
        elif isinstance(raw_pos, list):
            positions = raw_pos
    elif positions_db:
        positions = positions_db

    cash = float(broker_data.get("cash", snap["cash_balance"] if snap else 100.0))
    equity = float(snap["total_equity"] if snap else cash)
    circuit_tier = int(snap["circuit_breaker_tier"] if snap else 0)
    updated_at = snap["timestamp"] if snap else broker_data.get("saved_at")

    account = {
        "equity": equity,
        "cash": cash,
        "buying_power": cash,
        "circuit_tier": circuit_tier,
        "updated_at": updated_at,
    }

    # Reports: list of markdown files
    reports = []
    for rpath in sorted(glob.glob(str(stock_dir / "docs" / "reports" / "*.md"))):
        p = Path(rpath)
        try:
            mtime = datetime.fromtimestamp(p.stat().st_mtime).isoformat()
            content = p.read_text(encoding="utf-8", errors="ignore")
            reports.append({
                "name": p.name,
                "modified": mtime,
                "content": content,
            })
        except Exception:
            pass

    # Logs: last 100 lines
    def tail_log(fname, n=100):
        lpath = stock_dir / "logs" / fname
        if not lpath.exists():
            return []
        try:
            with open(lpath, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                return [line.rstrip() for line in lines[-n:]]
        except Exception:
            return []

    logs = {
        "daily_run": tail_log("daily_run.log"),
        "daily_run_aggressive": tail_log("daily_run_aggressive.log"),
    }

    return {
        "profile": profile,
        "halted_lock": halted_lock,
        "account": account,
        "last_run": last_run,
        "reconciliation": recon,
        "positions": positions,
        "candidates": candidates,
        "orders": orders,
        "audit_logs": audit_logs,
        "reports": reports,
        "logs": logs,
    }

def main():
    parser = argparse.ArgumentParser(description="Extract Stock Exchange State")
    parser.add_argument("--profile", type=str, default="core", choices=["core", "aggressive"])
    parser.add_argument("--stock-dir", type=str, default=None)
    parser.add_argument("--all", action="store_true", help="Extract all profiles for snapshot sync")
    args = parser.parse_args()

    stock_dir_env = os.environ.get("STOCK_EXCHANGE_DIR")
    default_dir = Path(__file__).resolve().parent.parent.parent.parent / "stock-exchange"
    stock_dir_str = args.stock_dir or stock_dir_env or str(default_dir)
    stock_dir = Path(stock_dir_str).resolve()

    if not stock_dir.exists():
        sys.stderr.write(f"Stock exchange directory not found at {stock_dir}\n")
        sys.exit(1)

    if args.all:
        core_data = extract_profile_data(stock_dir, "core")
        agg_data = extract_profile_data(stock_dir, "aggressive")
        result = {
            "is_snapshot": True,
            "snapshot_timestamp": datetime.now().isoformat(),
            "core": core_data,
            "aggressive": agg_data,
        }
    else:
        result = extract_profile_data(stock_dir, args.profile)
        result["is_snapshot"] = False
        result["snapshot_timestamp"] = datetime.now().isoformat()

    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
