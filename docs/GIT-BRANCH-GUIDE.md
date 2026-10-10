# Git Branch Push — Step by Step

```bash
git checkout main
git pull origin main
git checkout -b feature/public-dashboard
git add .
git commit -m "feat: improve public dashboard"
git push -u origin feature/public-dashboard
```

Repeat from the latest base branch for each module:
- feature/public-dashboard
- feature/student-portal
- feature/pt-staff
- feature/admin
- feature/notification-center
- feature/reports-audit
- feature/ui-ux-branding
- feature/unique-features
- feature/pt-staff-od-letter

For OD:
```bash
git checkout main
git pull origin main
git checkout -b feature/pt-staff-od-letter
# implement/test the OD generator
git add .
git commit -m "feat: add automatic PT staff OD letter generator"
git push -u origin feature/pt-staff-od-letter
```
Then create a Pull Request to `develop` (or `main` if no develop branch exists).
