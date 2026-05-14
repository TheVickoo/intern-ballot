# Agent Sandbox Devcontainer

A generic development container designed as a sandbox environment for AI coding agents, specifically optimized for [opencode](https://opencode.ai) and [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Features

- **Node.js 24 (Bookworm)** - Modern JavaScript/TypeScript runtime
- **Pre-installed AI Agents** - Both opencode-ai and Claude Code available globally
- **File Searching Tools** - ripgrep and fd-find for efficient code search
- **Isolated Agent Data** - Separate volumes for agent configs and data
- **Bind-mounted Workspace** - Your local code mounted directly into the container

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [VS Code](https://code.visualstudio.com/) with [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), or
- [JetBrains Gateway](https://www.jetbrains.com/remote-development/gateway/), or
- [Docker CLI](https://docs.docker.com/engine/reference/commandline/cli/) directly

## Usage

### VS Code (Recommended)

1. Open the project in VS Code
2. Install the **Dev Containers** extension
3. Click "Reopen in Container" when prompted, or use the command palette: `Dev Containers: Reopen in Container`

### Docker CLI

```bash
# Build the image
docker build -t agent-sandbox -f .devcontainer/Dockerfile .devcontainer

# Create volumes
docker volume create agent-sandbox-opencode-config
docker volume create agent-sandbox-opencode-data

# Run the container
docker run -it --rm \
  -v $(pwd):/home/node/workspace \
  -v agent-sandbox-opencode-config:/home/node/.config/opencode \
  -v agent-sandbox-opencode-data:/home/node/.local/share/opencode \
  agent-sandbox
```

### JetBrains Gateway

Open the project in Gateway and select "Dev Container" as the environment.

## Container Structure

```
/home/node/workspace     <- Your local code (bind-mounted)
/home/node/.config/opencode    <- Agent configs (persistent volume)
/home/node/.local/share/opencode <- Agent data (persistent volume)
```

## Installed Tools

### Runtime
- Node.js 24

### CLI Tools
- opencode-ai (latest)
- Claude Code (latest)

### Utilities
- git
- ripgrep (rg)
- fd-find (fd)
- unzip

## Customization

### Adding Software

Edit `.devcontainer/Dockerfile` to add additional packages:

```dockerfile
RUN apt-get install -y --no-install-recommends \
    git \
    ripgrep \
    fd-find \
    unzip \
    your-additional-package \
    && rm -rf /var/lib/apt/lists/*
```

### Adding Global npm Packages

Add to the npm install line in the Dockerfile:

```dockerfile
RUN npm install -g opencode-ai@latest \
    @anthropic-ai/claude-code@latest \
    your-package@latest
```

## License

MIT
