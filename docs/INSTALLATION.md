# Step-by-Step Installation Guide

This guide provides detailed instructions for installing all dependencies needed to run the uncensored-ai application on your local machine.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Step 1: Install Node.js and npm](#step-1-install-nodejs-and-npm)
3. [Step 2: Install Git](#step-2-install-git)
4. [Step 3: Install Docker and Docker Compose](#step-3-install-docker-and-docker-compose)
5. [Step 4: Clone the Repository](#step-4-clone-the-repository)
6. [Step 5: Install Project Dependencies](#step-5-install-project-dependencies)
7. [Step 6: Verify Installation](#step-6-verify-installation)
8. [Troubleshooting](#troubleshooting)
9. [Next Steps](#next-steps)

---

## System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB free space
- **Internet**: Stable internet connection for downloading dependencies

### Required Software Versions
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (comes with Node.js)
- **Docker**: 20.10.0 or higher
- **Docker Compose**: 2.0.0 or higher
- **Git**: 2.30.0 or higher

---

## Step 1: Install Node.js and npm

Node.js is required to run the application, and npm (Node Package Manager) is used to install JavaScript dependencies.

### Check if Already Installed

Open your terminal/command prompt and run:

```bash
node --version
npm --version
```

If you see version numbers (e.g., `v18.17.0` and `9.6.7`), Node.js and npm are already installed. **Ensure Node.js is version 18 or higher.**

### Installation Instructions

#### **Windows**

1. **Download the installer:**
   - Go to [nodejs.org](https://nodejs.org/)
   - Download the **LTS (Long Term Support)** version installer
   - Choose the Windows installer (.msi file)

2. **Run the installer:**
   - Double-click the downloaded file
   - Follow the installation wizard
   - Accept the license agreement
   - Choose the default installation path
   - **Important**: Check the box that says "Automatically install the necessary tools"
   - Click "Install" and wait for completion

3. **Verify installation:**
   ```cmd
   node --version
   npm --version
   ```

#### **macOS**

**Option 1: Using the Official Installer**

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the macOS installer (.pkg file)
3. Double-click to run and follow the installer
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**Option 2: Using Homebrew (Recommended)**

1. Install Homebrew if you don't have it:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Node.js:
   ```bash
   brew install node@18
   ```

3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### **Linux (Ubuntu/Debian)**

1. **Update package manager:**
   ```bash
   sudo apt update
   ```

2. **Install Node.js 18.x:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```

#### **Linux (Fedora/RHEL/CentOS)**

1. **Install Node.js 18.x:**
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo dnf install -y nodejs
   ```

2. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```

### ✅ Verification Checklist
- [ ] `node --version` shows v18.0.0 or higher
- [ ] `npm --version` shows a version number

---

## Step 2: Install Git

Git is required to clone the repository and manage version control.

### Check if Already Installed

```bash
git --version
```

If you see a version number (e.g., `git version 2.39.0`), Git is already installed.

### Installation Instructions

#### **Windows**

1. **Download Git:**
   - Go to [git-scm.com](https://git-scm.com/download/win)
   - Download the installer for Windows

2. **Run the installer:**
   - Double-click the downloaded .exe file
   - Use default settings unless you have specific preferences
   - **Important settings:**
     - Choose "Git from the command line and also from 3rd-party software"
     - Choose "Use bundled OpenSSH"
     - Choose "Checkout Windows-style, commit Unix-style line endings"

3. **Verify installation:**
   - Open a new command prompt or Git Bash
   ```cmd
   git --version
   ```

#### **macOS**

**Option 1: Using Xcode Command Line Tools**

```bash
xcode-select --install
```

**Option 2: Using Homebrew (Recommended)**

```bash
brew install git
```

**Verify installation:**
```bash
git --version
```

#### **Linux (Ubuntu/Debian)**

```bash
sudo apt update
sudo apt install git
git --version
```

#### **Linux (Fedora/RHEL/CentOS)**

```bash
sudo dnf install git
git --version
```

### ✅ Verification Checklist
- [ ] `git --version` shows a version number

---

## Step 3: Install Docker and Docker Compose

Docker is used to run PostgreSQL and Redis databases locally without installing them directly on your system.

### Check if Already Installed

```bash
docker --version
docker compose version
```

If you see version numbers, Docker and Docker Compose are installed.

### Installation Instructions

#### **Windows**

1. **Download Docker Desktop:**
   - Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
   - Download Docker Desktop for Windows

2. **System Requirements:**
   - Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
   - OR Windows 11 64-bit: Home, Pro, Enterprise, or Education
   - Enable WSL 2 (Windows Subsystem for Linux 2)

3. **Install Docker Desktop:**
   - Run the installer
   - Follow the installation wizard
   - Enable "Use WSL 2 instead of Hyper-V" if prompted
   - Restart your computer when prompted

4. **Start Docker Desktop:**
   - Launch Docker Desktop from Start menu
   - Wait for Docker to start (you'll see the Docker icon in system tray)

5. **Verify installation:**
   ```cmd
   docker --version
   docker compose version
   ```

#### **macOS**

1. **Download Docker Desktop:**
   - Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
   - Download Docker Desktop for Mac
   - Choose the correct version for your chip:
     - **Intel chip**: Docker Desktop for Mac with Intel chip
     - **Apple Silicon (M1/M2/M3)**: Docker Desktop for Mac with Apple chip

2. **Install Docker Desktop:**
   - Open the downloaded .dmg file
   - Drag Docker.app to Applications folder
   - Open Docker from Applications
   - Follow the setup wizard

3. **Verify installation:**
   ```bash
   docker --version
   docker compose version
   ```

#### **Linux (Ubuntu/Debian)**

1. **Remove old versions (if any):**
   ```bash
   sudo apt-get remove docker docker-engine docker.io containerd runc
   ```

2. **Set up Docker repository:**
   ```bash
   sudo apt-get update
   sudo apt-get install ca-certificates curl gnupg lsb-release
   
   sudo mkdir -p /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   ```

3. **Install Docker Engine:**
   ```bash
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

4. **Add your user to docker group (to run without sudo):**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

5. **Verify installation:**
   ```bash
   docker --version
   docker compose version
   ```

#### **Linux (Fedora/RHEL/CentOS)**

1. **Set up Docker repository:**
   ```bash
   sudo dnf -y install dnf-plugins-core
   sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
   ```

2. **Install Docker Engine:**
   ```bash
   sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

3. **Start Docker:**
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

4. **Add your user to docker group:**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

5. **Verify installation:**
   ```bash
   docker --version
   docker compose version
   ```

### ✅ Verification Checklist
- [ ] `docker --version` shows version 20.10.0 or higher
- [ ] `docker compose version` shows version 2.0.0 or higher
- [ ] Docker Desktop is running (Windows/macOS) or Docker daemon is running (Linux)
- [ ] You can run `docker run hello-world` successfully

---

## Step 4: Clone the Repository

Now that you have all prerequisite software installed, clone the project repository.

### Steps

1. **Open your terminal/command prompt**

2. **Navigate to where you want to store the project:**
   ```bash
   # Example: Navigate to your projects folder
   cd ~/projects         # macOS/Linux
   cd C:\Users\YourName\projects    # Windows
   ```

3. **Clone the repository:**
   ```bash
   git clone https://github.com/kevanaenterprises-bot/uncensored-ai.git
   ```

4. **Navigate into the project directory:**
   ```bash
   cd uncensored-ai
   ```

5. **Verify you're in the correct directory:**
   ```bash
   ls    # macOS/Linux
   dir   # Windows
   ```
   
   You should see files like `package.json`, `README.md`, `docker-compose.yml`, etc.

### ✅ Verification Checklist
- [ ] Repository cloned successfully
- [ ] You're in the `uncensored-ai` directory
- [ ] You can see project files (package.json, README.md, etc.)

---

## Step 5: Install Project Dependencies

This is the main step where npm will download and install all JavaScript packages required by the application.

### Understanding the Dependencies

The project has two types of dependencies:

1. **Production Dependencies** (packages needed to run the app):
   - `next` - React framework
   - `react`, `react-dom` - UI libraries
   - `@prisma/client` - Database client
   - `next-auth` - Authentication
   - `stripe` - Payment processing
   - `bcryptjs` - Password hashing
   - And more...

2. **Development Dependencies** (packages needed for development):
   - `typescript` - Type checking
   - `jest` - Testing framework
   - `eslint` - Code linting
   - `prettier` - Code formatting
   - And more...

### Installation Steps

1. **Ensure you're in the project directory:**
   ```bash
   pwd    # macOS/Linux - should show path ending in /uncensored-ai
   cd     # Windows - should show path ending in \uncensored-ai
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

   **What happens during `npm install`:**
   - npm reads `package.json` to see what packages are needed
   - Downloads packages from the npm registry
   - Installs them in the `node_modules` folder
   - Creates a `package-lock.json` file to lock versions
   - This can take 2-5 minutes depending on your internet speed

3. **Wait for completion:**
   You'll see output like:
   ```
   npm WARN deprecated ...
   added 1234 packages, and audited 1235 packages in 2m
   
   123 packages are looking for funding
     run `npm fund` for details
   
   found 0 vulnerabilities
   ```

### Common Installation Issues and Solutions

#### Issue: `npm: command not found`
**Solution:** Node.js/npm not properly installed. Go back to [Step 1](#step-1-install-nodejs-and-npm).

#### Issue: `EACCES: permission denied`
**Solution (macOS/Linux):** 
```bash
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) ~/.config
```

#### Issue: `npm ERR! network` or timeout errors
**Solutions:**
```bash
# Try using a different registry
npm config set registry https://registry.npmjs.org/

# Or clear npm cache and retry
npm cache clean --force
npm install
```

#### Issue: `gyp ERR! stack Error: EACCES` (Windows)
**Solution:** Run your terminal/PowerShell as Administrator and retry.

#### Issue: Package conflicts or peer dependency warnings
**Solution:**
```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps
```

### ✅ Verification Checklist
- [ ] `npm install` completed without errors
- [ ] `node_modules` folder was created
- [ ] `package-lock.json` file was created or updated
- [ ] No red ERROR messages (warnings in yellow are usually okay)

---

## Step 6: Verify Installation

Let's verify everything is installed correctly before proceeding.

### 1. Check Node Modules

```bash
# Check if node_modules folder exists
ls node_modules    # macOS/Linux
dir node_modules   # Windows
```

You should see hundreds of folders (one for each dependency).

### 2. Check Prisma Client

Generate the Prisma client to verify database tooling works:

```bash
npx prisma generate
```

Expected output:
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### 3. Check TypeScript

Verify TypeScript is installed:

```bash
npx tsc --version
```

Should show something like: `Version 5.x.x`

### 4. Check Available Scripts

View all available npm scripts:

```bash
npm run
```

You should see:
```
Scripts available via `npm run`:
  dev
    next dev
  build
    next build
  start
    next start
  lint
    eslint . --ext .ts,.tsx
  test
    jest
```

### 5. Quick Test Build (Optional)

Test if the project can build:

```bash
npm run build
```

**Note:** This might fail if you haven't set up environment variables yet, which is expected. The important thing is that it recognizes the `build` command.

### ✅ Final Verification Checklist
- [ ] `node_modules` folder exists and contains packages
- [ ] `npx prisma generate` runs successfully
- [ ] `npx tsc --version` shows TypeScript version
- [ ] `npm run` shows available scripts
- [ ] No major errors in any verification step

---

## Troubleshooting

### General Troubleshooting Steps

If you encounter issues:

1. **Check your Node.js version:**
   ```bash
   node --version
   ```
   Must be 18.0.0 or higher.

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

3. **Delete node_modules and reinstall:**
   ```bash
   # macOS/Linux
   rm -rf node_modules package-lock.json
   npm install
   
   # Windows (PowerShell)
   Remove-Item -Recurse -Force node_modules, package-lock.json
   npm install
   ```

4. **Check for conflicting global packages:**
   ```bash
   npm list -g --depth=0
   ```

5. **Update npm itself:**
   ```bash
   npm install -g npm@latest
   ```

### Platform-Specific Issues

#### **Windows-Specific**

**Issue:** Build tools not found
```bash
# Install Windows build tools
npm install --global windows-build-tools
```

**Issue:** Long path names causing errors
```bash
# Enable long paths in Git
git config --system core.longpaths true
```

#### **macOS-Specific**

**Issue:** Xcode command line tools needed
```bash
xcode-select --install
```

**Issue:** Permission issues
```bash
sudo chown -R $USER /usr/local/lib/node_modules
```

#### **Linux-Specific**

**Issue:** Missing build essentials
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# Fedora/RHEL
sudo dnf groupinstall "Development Tools"
```

### Getting Help

If you're still stuck after trying the troubleshooting steps:

1. **Check the error message carefully** - It often tells you what's wrong
2. **Search for the error** on Google or Stack Overflow
3. **Check GitHub Issues** in the project repository
4. **Ask for help** by creating an issue with:
   - Your operating system and version
   - Node.js and npm versions
   - The full error message
   - What you've already tried

---

## Next Steps

✅ **Congratulations!** You've successfully installed all dependencies.

### What to Do Next

1. **Set up your environment:**
   - See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions
   - Configure your `.env.local` file with API keys and secrets

2. **Start the development server:**
   ```bash
   # First, start Docker services (PostgreSQL & Redis)
   docker-compose up -d
   
   # Then start the Next.js development server
   npm run dev
   ```

3. **Access the application:**
   - Open your browser and go to `http://localhost:3000`

4. **Learn more:**
   - Read the [API Documentation](API.md)
   - Review the [Deployment Guide](DEPLOYMENT.md)
   - Check the [Implementation Summary](IMPLEMENTATION_SUMMARY.md)

### Quick Reference Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## Summary

You've completed the following:

✅ Installed Node.js and npm (v18+)  
✅ Installed Git (v2.30+)  
✅ Installed Docker and Docker Compose (v20.10+)  
✅ Cloned the repository  
✅ Installed all project dependencies with `npm install`  
✅ Verified the installation  

**Total installation time:** Approximately 15-30 minutes (depending on internet speed)

**Next:** Follow the [Development Setup Guide](DEVELOPMENT.md) to configure and run the application.

---

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [npm Documentation](https://docs.npmjs.com/)
- [Git Documentation](https://git-scm.com/doc)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Need help?** Open an issue in the repository with your question!
