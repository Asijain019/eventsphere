# Git workflow

This project directory is **not yet a Git repository**, and no GitHub repository, branch, PR or history has been created for you. Follow the steps below on your machine. The assignment checks commit history, so **do not squash everything into one commit** and do not fabricate history.

## 1. One-time setup

```bash
cd eventsphere
git init -b main
git config user.name  "Your Name"
git config user.email "you@example.com"
# .gitignore already excludes node_modules, .next, .env, uploads
git add .gitignore .env.example package.json package-lock.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.js \
        .eslintrc.json vitest.config.ts drizzle.config.ts
git commit -m "chore: scaffold Next.js, TypeScript, Tailwind and tooling"
```

Create the empty repository on GitHub (web UI, or `gh repo create <user>/eventsphere --private --source . --remote origin` ), then:

```bash
git remote add origin https://github.com/<user>/eventsphere.git   # skip if gh already added it
git push -u origin main
git switch -c develop && git push -u origin develop
```

## 2. Branches required by the brief

```bash
for b in authentication event-discovery event-registration communities volunteer organizer-dashboard devops; do
  git branch feature/$b develop
done
git branch -a
```

## 3. Commit per feature (recommended real history)

Work on the matching branch, commit in small logical steps, open a PR into `develop`, merge, repeat. Suggested mapping and messages (adapt to what each member actually does):

| Branch | Typical commits |
|---|---|
| `feature/authentication` | `feat: add database schema and migrations` · `feat: implement user authentication` · `feat: add profile editing` |
| `feature/event-discovery` | `feat: add event discovery and filtering` · `feat: add favourites` |
| `feature/event-registration` | `feat: implement event registration with capacity checks` · `feat: add team formation` |
| `feature/communities` | `feat: add community membership` · `feat: add attendee connections and messaging` |
| `feature/volunteer` | `feat: add volunteer application workflow` · `feat: add contestant applications` |
| `feature/organizer-dashboard` | `feat: add organizer dashboard` · `feat: add announcements and analytics` |
| `feature/devops` | `build: add Docker configuration` · `ci: configure GitHub Actions pipeline` · `docs: add project setup and architecture documentation` · `feat: add seed data` |

Example for one branch (stage only the files belonging to that feature):

```bash
git switch feature/devops
git add Dockerfile .dockerignore docker-compose.yml docker-compose.dev.yml docker-entrypoint.sh scripts/migrate.mjs
git commit -m "build: add Docker configuration"
git add .github
git commit -m "ci: configure GitHub Actions pipeline"
git add README.md docs
git commit -m "docs: add project setup and architecture documentation"
git push -u origin feature/devops
```

Conventional-commit prefixes: `feat`, `fix`, `build`, `ci`, `docs`, `test`, `refactor`, `chore`. Each team member should commit under their own identity so contributions are visible.

## 4. Pull requests with the GitHub CLI

```bash
gh auth login
gh pr create --base develop --head feature/devops \
   --title "build/ci: Docker, Compose and GitHub Actions" \
   --body-file .github/pull_request_template.md
gh pr checks            # watch the CI run
gh pr view --web
# teammate reviews, then:
gh pr review --approve
gh pr merge --merge     # use a merge commit (or rebase), NOT squash, to keep history
```

Release: open a PR `develop` → `main` when the integration branch is stable; Vercel deploys `main` to production.

## 5. Branch protection (GitHub → Settings → Branches → Add rule)

For `main` (and optionally `develop`):
- Require a pull request before merging, with at least 1 approval
- Require status checks to pass: select **Lint, typecheck, test, build** and **Docker image build** (they appear after the first CI run)
- Require branches to be up to date before merging
- Disallow force pushes and deletions

(Private repos on a free plan may not offer protection rules; if so, state that in your report and enforce the process manually.)

## 6. Verifying CI

After the first push: GitHub → **Actions** tab → the "CI" workflow should start automatically. Take a screenshot of a green run for the report; also push a deliberately failing commit on a throw-away branch if you want to demonstrate that the pipeline really fails on errors.
