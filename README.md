# Prime Panel & Quantum Go Daemon

A high-performance, Pterodactyl-inspired game management panel featuring a Go-native daemon and a futuristic HyperV1 neon-dark aesthetic.

## 🚀 Key Features

### **Go-Native Quantum Daemon**
- **High Concurrency**: Built with Go for superior performance and minimal resource overhead compared to Node.js daemons.
- **Docker-Powered**: Full container isolation using the Docker Engine API.
- **Real-Time Streaming**: High-speed WebSocket log streaming with memory-efficient buffering.
- **Self-Healing Engine**: Proactive Docker event listener that automatically monitors and repairs instance states.
- **Native File System API**: High-speed file operations (list, read, write, delete) directly through the Go binary.

### **Node.js/Express Panel**
- **Multi-Node Support**: Seamlessly manage hundreds of remote nodes from a single dashboard.
- **Smart Score Engine**: Automated load balancing that picks the best node for new instances based on RAM, CPU density, and over-allocation scores.
- **Pterodactyl-Style Server Editor**: Tabbed management for resources, startup directives, and networking.
- **Advanced Networking**: Full allocation management with IP and port assignment.
- **HyperV1 UI**: A sleek, high-contrast neon-dark theme designed for modern workflows.
- **Quantum Uplink Protocol**: Automated `curl`-based installer for rapid node deployment.

---

## 🛠️ Setup & Configuration

### **1. Panel Setup (Node.js)**

**Prerequisites:**
- Node.js 18+
- Docker (for local nodes)

**Steps:**
1. Clone the repository to your panel server.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database and admin account (first-run setup).
4. Start the panel:
   ```bash
   npm start
   ```

### **2. Node/Daemon Setup (Go)**

The daemon is the "Wings" of your panel. It must be installed on every server where you want to host game instances.

**Automated Setup (Recommended):**
1. In the Admin Panel, go to **Nodes** -> **Registry**.
2. Click **Create Node** and copy the generated `curl` command.
3. Run the command on your remote server to install the Quantum Go Daemon automatically.

**Manual Setup:**
1. Navigate to the `daemon-go` directory.
2. Build the Go binary:
   ```bash
   go build -o wings cmd/daemon/main.go
   ```
3. Create a `config.json` file in the same directory:
   ```json
   {
     "node_id": "your-node-uuid",
     "api_key": "your-secret-key",
     "port": 8080,
     "docker_host": "unix:///var/run/docker.sock"
   }
   ```
4. Start the daemon:
   ```bash
   ./wings
   ```

### **3. Connecting Node to Panel**
1. Go to **Admin** -> **Nodes** on the panel.
2. Add a new node with the IP address, Port, and API Key defined in your daemon's `config.json`.
3. The node should appear as **Online** in the registry.

---

## ⚡ Configuration Directives

### **Over-allocation**
- **RAM Over-allocation**: Allow the panel to deploy instances even if the physical RAM is full. Example: Setting to `20%` allows you to sell 12GB of RAM on a 10GB server.
- **Disk Over-allocation**: Similar to RAM, allows over-selling storage capacity.

### **Allocation Manager**
- Go to **Node** -> **Manage Allocations** to define the IP addresses and ports available for game servers.
- Use the **Initialize Endpoints** form to bulk-add port ranges (e.g., `25565-25600`).

---

## 🛠️ Troubleshooting

- **Node Offline?** Ensure the Go daemon is running and the port (default 8080) is open in your firewall.
- **Docker Issues?** Ensure the user running the daemon has permission to access the Docker socket.
- **Logs not showing?** Check if WebSockets are allowed through your reverse proxy (Nginx/Cloudflare).

---

## 📜 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
