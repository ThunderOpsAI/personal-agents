# Owner & User Guide for Antigravity (AGY)

Welcome! This guide explains how your workspace assistant is set up and how to use its built-in skills without needing technical knowledge.

---

## 1. Automatic ADHD Response Mode

### What it does:
The AI is configured to respond in a format optimized for focus and quick action. Every response will automatically:
- Start with the immediate next step or action (no conversational fluff).
- Break multi-step tasks into clear, numbered steps.
- Give concrete time estimates.
- Keep recommendations short and focused (max 5 items).

### Do you need to turn it on?
**No.** It runs automatically on every question you ask.

### How to turn it off or back on:
- **To turn off**: Type `"stop adhd mode"` or `"normal mode"`.
- **To turn back on**: Type `"turn on ADHD mode"`.

---

## 2. Code Review Graph (Codebase Explorer)

### What it does:
Code Review Graph helps the AI map out your project, trace how different parts of your code connect, and review changes safely before making updates.

### How to use it in plain English:

1. **First time or after big code updates**:
   - **Prompt**: `"Build code review graph"`
   - *What happens*: The AI indexes the project structure and saves a database map to your machine.

2. **Exploring your code**:
   - **Prompt**: `"Use explore-codebase to show me how [feature/file] works."`
   - *What happens*: The AI looks at the map and explains how parts of your project connect.

3. **Reviewing changes or pull requests**:
   - **Prompt**: `"Use review-pr to check my recent changes."`
   - *What happens*: The AI checks your edits against the code map to ensure nothing breaks.

4. **Returning after a week**:
   - You **do not** need to start over. The code map stays saved on your machine.
   - If you made changes over the week, just say: `"Update code review graph"`.
   - If no code changed, ask your question directly: `"Use explore-codebase to..."`.

---

## 3. Quick Copy-Paste Prompts

- **Build/Update Map**: `"Build code review graph"`
- **Explore Code**: `"Use explore-codebase to explain how user login works."`
- **Review PR**: `"Use review-pr to inspect my branch."`
- **Find Bugs**: `"Use debug-issue to trace why [problem] is happening."`
