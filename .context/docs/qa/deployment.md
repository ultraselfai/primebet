---
slug: deployment
category: operations
generatedAt: 2026-01-20T18:26:50.337Z
relevantFiles:
  - docker-compose.yml
  - coolify-mcp\Dockerfile
  - vibe-check-mcp-server\Dockerfile
---

# How do I deploy this project?

## Deployment

### Docker

This project includes Docker configuration.

```bash
docker build -t app .
docker run -p 3000:3000 app
```

### CI/CD

CI/CD pipelines are configured for this project.
Check `.github/workflows/` or equivalent for pipeline configuration.