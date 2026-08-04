# Antigravity (AGY) Slash Commands Guide

This guide details the available slash commands for **Google Antigravity (AGY)** and how to use them effectively within the `personal-agents` ecosystem.

---

## 🚀 Core Slash Commands Overview

| Slash Command | Primary Purpose | When & How to Use |
| :--- | :--- | :--- |
| **/learn** | **Persist Rules & Behaviors** | Use when you correct the agent or establish a new preference (e.g., email summary formats). It extracts reusable rules and saves them to `AGENTS.md` or a skill folder. |
| **/goal** | **Long-Running Autonomous Work** | Use for thorough, multi-step tasks (e.g., overnight research or complete codebase refactoring). Instructs the agent to continue until the goal is fully verified. |
| **/plan** | **Step-by-Step Task Planning** | Use for complex, multi-stage projects before writing code. Produces a detailed blueprint artifact for your review before execution begins. |
| **/grill-me** | **Interactive Design Interview** | Use when requirements are ambiguous. The agent interviews you with targeted multiple-choice questions to resolve architectural or design decisions. |
| **/schedule** | **Background Timers & Recurring Jobs** | Use to set one-shot timers or recurring cron schedules (e.g., polling task status, sending periodic updates). |
| **/teamwork-preview** | **Multi-Agent Orchestration** | Use for large projects that benefit from parallel subagents working in isolated branches or workspaces. |

---

## 🛠️ Detailed Usage Examples

### 1. `/learn` — Memory & Preference Persistence
* **Example**: You ask the agent to format email outputs with exact ticket IDs and phone numbers, then type `/learn`.
* **Result**: The agent generates a `learning_proposal.md` artifact showing the exact rule diff, then updates `AGENTS.md` upon your approval.

### 2. `/goal` — Unassisted Thorough Execution
* **Example**: `/goal Build and test a complete multi-agent harness for Gmail and Calendar integration with full unit tests.`
* **Result**: The agent will repeatedly test, debug, and verify until all goals pass.

### 3. `/plan` — Pre-Execution Blueprinting
* **Example**: `/plan Design an offline-first sync mechanism for physio rehab tracking.`
* **Result**: Creates a detailed plan artifact for you to review and approve before any code is modified.

### 4. `/grill-me` — Aligning Requirements
* **Example**: `/grill-me I want to build a medical dashboard UI.`
* **Result**: Prompts you with interactive questions regarding design themes, components, and data structures to ensure exact alignment.

---

## 📁 Repository Integration

These commands work alongside the project-specific guardrails defined in [`AGENTS.md`](file:///Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/AGENTS.md).
