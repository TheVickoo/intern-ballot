# Base image: Node + common dev tools
FROM node:24-bookworm

# 1. Install core OS packages for agent file searching
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    ripgrep \
    fd-find \
    unzip \
    tmux \
    && rm -rf /var/lib/apt/lists/*

# 2. Setup Directories & Permissions
RUN mkdir -p /home/node/workspace /home/node/.config /home/node/.local/share /home/node/.local/state \
    && chown -R node:node /home/node

# 3. Install Agent CLI tools globally AS ROOT
# Root has the correct permissions to write to /usr/local/bin
RUN npm install -g opencode-ai@latest \
    && npm install -g @anthropic-ai/claude-code@latest \
    && npm install -g @google/gemini-cli@latest \
    && npm install -g @googleworkspace/cli

# 4. Give 'node' user ownership of global node_modules and bin for easy updates
RUN chown -R node:node /usr/local/lib/node_modules /usr/local/bin

# 5. Switch to the non-root 'node' user for container runtime
USER node

WORKDIR /home/node/workspace