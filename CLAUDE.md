# Repo workflow

## Git branches
- Create the feature branch on origin first, then check it out locally:
  ```
  git push origin origin/master:refs/heads/<feature>
  git fetch origin <feature>
  git checkout -b <feature> origin/<feature>
  ```
- Never create a local-only branch and push later.
- Never open a PR unless the user asks for one.
- Commit to the feature branch; push with `git push -u origin <feature>`.

## Stack
- Backend: FastAPI in `backend_python_app/` (PyBuilder, 100% coverage required).
- Frontend: React + Vite. For browser testing, serve `dist/` via nginx; don't run React from the backend.
- Metals.dev key stays server-side in `.env` (gitignored). Never log or commit it.
