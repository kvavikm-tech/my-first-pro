Title
- Quick log: Setting up environment and Git identity for BMAD installer

Purpose
- Short reference for what we did and why, so you (or others) can review it later for learning.

Summary (one line)
- Installed Node, discovered PowerShell blocked npm/npx, planned two workarounds, and attempted to configure Git identity but Git was not installed — next step is to install Git and finish identity + authentication.

What I did (chronological, terse)
- Verified Node is installed
  - Command: node -v
  - Result: v25.4.0
- Tried to run npm/npx from PowerShell and hit PowerShell execution policy blocking the npm/npx wrapper scripts
  - Error: “npm.ps1 cannot be loaded because running scripts is disabled on this system.”
  - Two simple options given:
    - Use Command Prompt (cmd.exe) where npm/npx .cmd wrappers run without policy changes, or
    - Allow scripts in PowerShell for current user:
      - Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
      - (or run a one-off bypass: powershell -ExecutionPolicy Bypass -Command "npx bmad-method install")
- Attempted to set Git author identity but git command was not found
  - Command attempted: git config --global user.name "Martinus ..." (and email)
  - Error: “git : The term 'git' is not recognized” → Git is not installed or not on PATH

Commands recommended / used
- Check installed runtimes:
  - node -v
  - (from cmd) npm -v
  - (from cmd) npx -v
- PowerShell policy (if you choose to change it):
  - Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
- Install Git (choose one):
  - GUI: download and run https://git-scm.com/download/win (choose “Git from the command line…” during install)
  - winget: winget install --id Git.Git -e --source winget
- Verify Git and set identity (after Git installed):
  - git --version
  - git config --global user.name "Martinus Elliot Ekern Kvavik"
  - git config --global user.email "kvavikm@gmail.com"
  - git config --global credential.helper manager-core
- Test commit and push (example):
  - git add .
  - git commit -m "test: configure git identity"
  - git remote add origin https://github.com/OWNER/REPO.git
  - git push -u origin main
  - (GCM will open a browser to authenticate)

Current status (what remains)
- Node is installed and usable.
- npm/npx blocked in PowerShell — workaround: run npm/npx from Command Prompt or change PowerShell execution policy.
- Git is not yet installed → install Git, then set identity and configure authentication (GCM / gh / SSH / PAT).
- After Git identity + auth are done: run BMAD installer:
  - mkdir my-bmad-project && cd my-bmad-project
  - npx bmad-method install
  - or npx github:bmad-code-org/BMAD-METHOD install

Useful links
- Node downloads: https://nodejs.org/en/download/
- Git for Windows: https://git-scm.com/download/win
- Git Credential Manager (bundled with Git for Windows): https://aka.ms/gcm
- BMAD install docs in repo: https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/how-to/install-bmad.md

Next steps (recommended, minimal)
1. Install Git for Windows (GUI or winget).
2. Reopen terminal (cmd or PowerShell) and run:
   - git --version
   - git config --global user.name "Martinus..."
   - git config --global user.email "kvavikm@gmail.com"
   - git config --global credential.helper manager-core
3. Attempt a push to trigger GitHub sign-in (or run gh auth login).
4. Run the BMAD installer from the project folder:
   - npx bmad-method install

If you want, I can now:
- Walk you step-by-step through installing Git and running the exact commands (I can wait for your terminal output at each step), or
- Produce a one-page printable checklist you can follow offline. Which do you prefer?