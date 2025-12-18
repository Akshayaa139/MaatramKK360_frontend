# MaatramKK360

# 🚀 Deployment Guide – Azure VM (Ubuntu)

This guide explains how to deploy the **KK360 Backend & Frontend** on an **Azure Ubuntu VM** using **Node.js & PM2**.

---

## 🔧 Prerequisites

- Azure VM (Ubuntu 20.04 / 22.04)
- SSH access enabled (Port 22)
- Node.js & npm installed
- PM2 installed globally
- Required ports opened in Azure:
  - **3000** → Frontend
  - **5000** → Backend

---

## 📥 Connect to Azure VM
```bash
ssh <username>@<PUBLIC_IP>
```

---

## 📦 Install Node.js & PM2 (One Time)
```bash
sudo apt update
sudo apt install -y nodejs npm
sudo npm install -g pm2 serve
```

### Verify Installation
```bash
node -v
npm -v
pm2 -v
```

---

## 🟢 Backend Deployment

### 1️⃣ Navigate to Backend
```bash
cd ~/MaatramKK360_frontend/backend
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Fix Case-Sensitive Imports (Linux)

Ensure model imports match filenames exactly:
```javascript
require('../models/TimeSlot')
```

### 4️⃣ Start Backend with PM2
```bash
pm2 start server.js --name kk360-backend
```

### 5️⃣ Verify Backend
```bash
pm2 list
pm2 logs kk360-backend
```

---

## 🌐 Frontend Deployment (React)

### 1️⃣ Navigate to Frontend
```bash
cd ~/MaatramKK360_frontend/frontend
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Update Backend API URL

Replace localhost with Azure public IP:
```javascript
http://<PUBLIC_IP>:5000
```

### 4️⃣ Build Frontend
```bash
npm run build
```

### Verify Build
```bash
ls build
```

### 5️⃣ Serve Frontend with PM2
```bash
pm2 start serve --name kk360-frontend -- -s build -l 3000
```

---

## 📊 Check Running Services
```bash
pm2 list
```

### Expected Output
```
kk360-backend   online
kk360-frontend  online
```

---

## 🔁 Enable Auto-Start on Reboot
```bash
pm2 save
pm2 startup
```

**Note:** Run the command shown by PM2 output.

---

## 🌍 Access Application

- **Frontend:** `http://<PUBLIC_IP>:3000`
- **Backend:** `http://<PUBLIC_IP>:5000`

---

## 🔓 Azure Inbound Rules

| Port | Purpose  |
|------|----------|
| 22   | SSH      |
| 3000 | Frontend |
| 5000 | Backend  |

---

## ⚠️ Common Issues

- **Linux is case-sensitive** (`TimeSlot.js ≠ Timeslot.js`)
- Always run `npm run build` before serving frontend
- Ensure Azure ports are open in Network Security Group
- Use `pm2 logs <name>` for debugging

---

## 🛠️ Useful PM2 Commands
```bash
# View all processes
pm2 list

# View logs
pm2 logs kk360-backend
pm2 logs kk360-frontend

# Restart services
pm2 restart kk360-backend
pm2 restart kk360-frontend

# Stop services
pm2 stop kk360-backend
pm2 stop kk360-frontend

# Delete services
pm2 delete kk360-backend
pm2 delete kk360-frontend

# Monitor services
pm2 monit
```

---

## ✅ Production Status

- ✅ Backend managed by PM2
- ✅ Frontend served using `serve`
- ✅ Auto-restart enabled on VM reboot

---

## 🚀 Deployment Successful

Your application is now live and running on Azure VM!

---

## 📝 Notes

- For production, consider using **Nginx** as reverse proxy
- Set up **SSL/TLS** certificates for HTTPS
- Configure **environment variables** for sensitive data
- Implement **monitoring** and **logging** solutions
- Set up **automated backups** for database

---



**Last Updated:** December 2024
