# DevOps Dashboard Portfolio

## 👤 เกี่ยวกับฉัน

สวัสดีครับ ผมได้ออกแบบและพัฒนา Workflow สำหรับการพัฒนาและ Deploy ระบบ Web Application โดยเน้นการนำเทคโนโลยีสมัยใหม่ เช่น Docker, Kubernetes, Jenkins และ Infrastructure as Code มาประยุกต์ใช้เพื่อเพิ่มประสิทธิภาพและความน่าเชื่อถือของระบบ

---

## 🌟 จุดเด่นและทักษะ (Highlights & Skills)

- **DevOps Automation:** เชี่ยวชาญการสร้าง CI/CD Pipeline ด้วย Jenkins
- **Containerization:** มีประสบการณ์กับ Docker, Docker Compose
- **Cloud Native:** ใช้งาน Kubernetes สำหรับการจัดการและ scale ระบบ
- **Infrastructure as Code:** เขียนและจัดการ Kubernetes manifests, config management
- **Team Collaboration:** ทำงานร่วมกับทีมพัฒนาและ operation ได้อย่างมีประสิทธิภาพ

---

## 🏆 ผลงานเด่น: DevOps Dashboard Project

### Project Overview

โปรเจกต์นี้เป็นตัวอย่างการนำแนวคิด DevOps มาประยุกต์ใช้กับระบบ Web Application ที่ประกอบด้วย Backend (Python Flask) และ Frontend (React.js) พร้อมทั้งมีการจัดการ Deployment, Automation, และ Infrastructure ด้วยเครื่องมือ DevOps สมัยใหม่

### โครงสร้างโปรเจกต์

```
DevOps-Dashboard/
  ├── backend/                # โค้ดฝั่ง Backend (Flask)
  ├── frontend/               # โค้ดฝั่ง Frontend (React)
  ├── k8s/                    # ไฟล์ Kubernetes manifests
  ├── Jenkinsfile             # Pipeline สำหรับ Jenkins CI/CD
  ├── docker-compose.yml      # สำหรับรันระบบแบบ local ด้วย Docker Compose
  ├── nginx.conf              # ไฟล์ config สำหรับ Nginx reverse proxy
  └── ... (ไฟล์อื่นๆ)
```

---

## 🚀 DevOps Workflow

### 1. **Containerization ด้วย Docker**
- สร้าง Dockerfile แยกสำหรับ backend และ frontend
- ใช้ `docker-compose.yml` สำหรับ orchestrate ระบบแบบ local

### 2. **CI/CD Pipeline ด้วย Jenkins**
- Pipeline อัตโนมัติ: build, test, push image, deploy ขึ้น Kubernetes
- ทุกครั้งที่ push โค้ดใหม่ Jenkins จะ trigger pipeline

### 3. **Infrastructure as Code ด้วย Kubernetes**
- มี manifests สำหรับ deployment, service, ingress
- Deploy ระบบทั้งหมดด้วย `kubectl apply -f k8s/`

### 4. **Reverse Proxy ด้วย Nginx**
- ใช้ Nginx เป็น reverse proxy จัดการ routing ระหว่าง frontend/backend

### 5. **Configuration Management**
- ใช้ไฟล์ config เช่น `projects.yaml` เพื่อความยืดหยุ่น

---

## 🛠️ วิธีการใช้งาน (How to Use)

### Local Development
```bash
docker-compose up --build
```

### Deploy to Kubernetes
```bash
kubectl apply -f k8s/
```

### CI/CD Pipeline (Jenkins)
- Pipeline จะรันอัตโนมัติเมื่อ push โค้ดใหม่
- ดูรายละเอียด pipeline ได้ใน Jenkins UI

---

## 💡 DevOps Best Practices ที่นำมาใช้
- **Automation:** ทุกขั้นตอน automate ด้วย Jenkins
- **Consistency:** ใช้ Docker ให้ environment เหมือนกันทุกที่
- **Scalability:** ใช้ Kubernetes รองรับการ scale
- **Observability:** รองรับการเพิ่ม monitoring/logging
- **Configuration as Code:** ทุกอย่างอยู่ในรูปแบบไฟล์ config

---

## 📫 ช่องทางติดต่อ (Contact)
- Email: supalurk.ch@gmail.com
- GitHub: [your-github-profile](https://github.com/Endy74757)

---

> หากต้องการรายละเอียดหรือคู่มือการใช้งานเพิ่มเติม สามารถสอบถามได้ครับ
