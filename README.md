# Prime Panel & Quantum Go Daemon

A high-performance, Pterodactyl-inspired game management panel featuring a Go-native daemon and a futuristic HyperV1 neon-dark aesthetic.

## 🚀 Key Features

### **Go-Native Quantum Daemon (Wings Alternative)**
- **High Concurrency**: Built with Go for superior performance and minimal resource overhead compared to Node.js daemons.
- **Docker-Powered**: Full container isolation using the Docker Engine API.
- **Real-Time Telemetry**: Integrated `gopsutil` for live VPS hardware monitoring (CPU/RAM/Disk).
- **Instant Power Actions**: High-speed WebSocket-based power control (Start/Stop/Restart/Kill).
- **Self-Healing Engine**: Proactive Docker event listener that automatically monitors and repairs instance states.
- **Native File System API**: High-speed file operations directly through the Go binary.

### **Node.js/Express Panel**
- **HyperV1 UI**: A sleek, high-contrast neon-dark theme with glassmorphism and neon accents.
- **Pterodactyl-Style Nest/Egg Architecture**: Hierarchical game configuration system with dynamic environment variables.
- **Quantum Transfer**: Seamlessly migrate server instances between different nodes across the grid.
- **Quantum Perimeter Defense**: Integrated DDoS protection with "Under Attack Mode" and IP blacklisting.
- **Smart Score Engine**: Automated load balancing that picks the best node for new instances.
- **Real-Time Console**: High-performance Xterm.js terminal with instant command execution.

---

## 🛠️ Setup & Configuration

### **1. Panel Setup (Node.js)**

**Prerequisites:**
- Node.js 20+
- SQLite3

**Steps:**
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the panel:
   ```bash
   npm start
   ```

### **2. Quantum Daemon Setup (Go)**

**Manual Setup:**
1. Navigate to the `daemon-go` directory.
2. Build the Go binary:
   ```bash
   go build -o quantum-daemon cmd/daemon/main.go
   ```
3. Start the daemon:
   ```bash
   ./quantum-daemon
   ```

---

## 🛡️ Security & Mitigation

### **Quantum Perimeter**
- **Under Attack Mode**: Enabling this toggles aggressive Layer 7 filtering and a 3.5s automated connection analysis challenge.
- **IP Blacklisting**: Permanently block malicious sectors from accessing your grid.
- **Audit Logging**: Comprehensive tracking of all administrative and deployment actions.

---

## ⚙️ Game Configurations (Nests & Eggs)
Prime Panel uses a hierarchical system:
- **Nests**: Categorize games (e.g., Minecraft, Source Engine).
- **Eggs**: Specific game versions or variants with custom Docker images, startup commands, and environment variables.

---

## 🛠️ VPS Installation Commands

### **Docker Installation**
```bash
# Update package list and install dependencies
sudo apt update && sudo apt install -y curl gnupg lsb-release

# Add Docker's GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable
sudo systemctl start docker && sudo systemctl enable docker
```

### **Node.js Installation**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### **Go Installation**
```bash
wget https://go.dev/dl/go1.22.1.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.22.1.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

---

## 📜 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
