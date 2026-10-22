JARVIS — Vercel-ready static site

DEPLOYMENT FIX
- The webpage is named index.html and is at the project root.
- vercel.json supplies a minimal static-site configuration.

DEPLOY
1. Upload these files to the ROOT of your GitHub repository (not inside a nested folder).
2. In Vercel, import that repository.
3. In Project Settings > Build and Deployment:
   - Framework Preset: Other
   - Build Command: leave empty / Override off
   - Output Directory: leave empty / default (the project root)
   - Root Directory: . (repository root)
4. Redeploy, then open the deployment's assigned URL.

NOTES
- This is still a front-end prototype. Chat replies are demo logic, not a connected AI model.
- No API key is needed for the static page.
- Do not put secret API keys in index.html.
