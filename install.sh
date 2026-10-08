#!/usr/bin/env bash
# Personal OS — the one-command install for Mac and Linux.
#
#   curl -fsSL https://raw.githubusercontent.com/sagdish/personal_OS-/main/install.sh | bash
#
# Gets the folder (into ./personal-os, or PERSONAL_OS_DIR), puts Node and Claude Code on this
# machine if they are missing, installs the OS, and prints what to type next. Inside a folder you
# already downloaded or cloned, `bash install.sh` does the same without downloading again.
# Windows: see the README, "By hand".
#
# PERSONAL_OS_DRY=1 prints what would run instead of running it.

set -e

say()  { printf '%s\n' "$*"; }
step() { printf '\n== %s\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }
run()  { if [ -n "${PERSONAL_OS_DRY:-}" ]; then say "  (would run) $*"; else "$@"; fi; }

OS="$(uname -s)"
case "$OS" in
  Darwin|Linux) ;;
  *) say "This installer is for Mac and Linux. On Windows, follow the README, section By hand."; exit 1 ;;
esac

# ---- 1. the folder --------------------------------------------------------------------------
if [ -f "./bin/os.mjs" ] && [ -f "./SETUP.md" ]; then
  DIR="$(pwd)"
  step "Personal OS folder: $DIR"
else
  DIR="${PERSONAL_OS_DIR:-$(pwd)/personal-os}"
  step "Getting Personal OS into $DIR"
  if [ -e "$DIR" ] && [ -n "$(ls -A "$DIR" 2>/dev/null)" ]; then
    say "  $DIR exists and is not empty. Move it away, or set PERSONAL_OS_DIR to another folder."
    exit 1
  fi
  if have git; then
    run git clone --quiet --depth 1 https://github.com/sagdish/personal_OS-.git "$DIR"
  else
    TMP="$(mktemp -d)"
    run curl -fsSL -o "$TMP/os.zip" https://github.com/sagdish/personal_OS-/archive/refs/heads/main.zip
    run unzip -q "$TMP/os.zip" -d "$TMP"
    run mv "$TMP/personal_OS--main" "$DIR"
    rm -rf "$TMP"
  fi
  say "  done"
fi

# ---- 2. Node ----------------------------------------------------------------------------------
step "Node"
NODE_OK=0
if have node; then
  MAJOR="$(node -e 'process.stdout.write(process.versions.node.split(".")[0])' 2>/dev/null || echo 0)"
  if [ "${MAJOR:-0}" -ge 20 ]; then NODE_OK=1; say "  found $(node --version)"; else say "  found $(node --version), too old; installing a current one"; fi
fi
if [ "$NODE_OK" -eq 0 ]; then
  if [ "$OS" = "Darwin" ]; then
    if have brew; then
      say "  installing Node with Homebrew…"
      run brew install node
    else
      INDEX="$(curl -fsSL https://nodejs.org/dist/index.json)"
      V="$(printf '%s' "$INDEX" | tr '}' '\n' | grep -m1 '"lts":"' | grep -o '"version":"v[0-9][0-9.]*"' | grep -o 'v[0-9][0-9.]*')"
      [ -n "$V" ] || { say "  could not find the current Node version online. Get it at https://nodejs.org and run this again."; exit 1; }
      say "  downloading the official Node $V installer. The Mac asks for your password to install it."
      PKG="$(mktemp -d)/node-$V.pkg"
      run curl -fsSL -o "$PKG" "https://nodejs.org/dist/$V/node-$V.pkg"
      run sudo installer -pkg "$PKG" -target /
      export PATH="/usr/local/bin:$PATH"
    fi
  else
    say "  installing Node with nvm (in your home folder, no password)…"
    run bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash'
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    # shellcheck disable=SC1091
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    run nvm install --lts
  fi
  if [ -z "${PERSONAL_OS_DRY:-}" ] && ! have node; then
    say "  Node did not land on the PATH. Open a new terminal window and run this again."
    exit 1
  fi
fi

# ---- 3. Claude Code ----------------------------------------------------------------------------
step "Claude Code"
if have claude; then
  say "  found $(claude --version 2>/dev/null | head -1)"
else
  say "  installing Claude Code (the official installer)…"
  run bash -c 'curl -fsSL https://claude.ai/install.sh | bash'
  export PATH="$HOME/.local/bin:$PATH"
  if [ -z "${PERSONAL_OS_DRY:-}" ] && ! have claude; then
    say "  Claude Code is installed but not on this window's PATH yet; a new window will have it."
  fi
fi

# ---- 4. the OS ---------------------------------------------------------------------------------
step "Installing Personal OS"
cd "$DIR"
if [ -n "${PERSONAL_OS_NO_ALIAS:-}" ]; then run node bin/os.mjs install --no-alias; else run node bin/os.mjs install; fi

step "Done"
say "  1. Open a NEW terminal window. The shortcuts exist only in new ones."
say "  2. Go into the folder:   cd \"$DIR\""
say "  3. Type: claude       and inside it type: /setup"
say "     If Claude Code asks whether you trust this folder, say yes."
say "     It asks before running a command or writing a file: say yes. That is the setup working."
say "     No Claude account yet? The first \`claude\` signs you in; it needs a Pro or Max plan."
