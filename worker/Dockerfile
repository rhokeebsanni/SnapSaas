# SnapSaas screenshot worker.
# Build from the REPO ROOT so the workspace manifests + lockfile are available:
#   docker build -f worker/Dockerfile -t snapsaas-worker .
#
# The official Playwright image already ships Chromium + all system/browser
# dependencies and fonts (which Sharp's SVG text rendering also relies on).
FROM mcr.microsoft.com/playwright:v1.61.0-jammy

WORKDIR /app

# Don't run git hooks during install.
ENV HUSKY=0
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install dependencies first (better layer caching). All workspace manifests
# must be present for npm workspaces to resolve.
COPY package.json package-lock.json ./
COPY web/package.json ./web/package.json
COPY worker/package.json ./worker/package.json
RUN npm ci

# Build the worker.
COPY worker ./worker
RUN npm run build --workspace worker

# Switch to production only after installing/building (so devDeps were available).
ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "worker/dist/index.js"]
