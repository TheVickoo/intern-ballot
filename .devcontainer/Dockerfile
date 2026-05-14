# Base image: Node + common dev tools
FROM node:24-bookworm

# 1. Install core OS packages for agent file searching
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    ripgrep \
    fd-find \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 2. Setup Directories & Permissions
# This ensures the 'node' user owns everything in its home directory
RUN mkdir -p /home/node/workspace \
    && mkdir -p /home/node/.local/share/opencode \
    && mkdir -p /home/node/.config/opencode \
    && chown -R node:node /home/node

# 3. Install Agent CLI tools globally AS ROOT
# Root has the correct permissions to write to /usr/local/bin
RUN npm install -g opencode-ai@latest \
    && npm install -g @anthropic-ai/claude-code@latest

# 4. Switch to the non-root 'node' user for container runtime
USER node

WORKDIR /home/node/workspace