# DevOps Dashboard

โปรเจกต์นี้เป็นตัวอย่างการนำแนวคิด DevOps มาประยุกต์ใช้กับระบบ Web Application ที่ประกอบด้วย Backend (Python Flask) และ Frontend (React.js) พร้อมทั้งมีการจัดการ Deployment, Automation, และ Infrastructure ด้วยเครื่องมือ DevOps สมัยใหม่

---

## โครงสร้างโปรเจกต์

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

## DevOps Workflow ที่ใช้ในโปรเจกต์นี้

### 1. **Containerization ด้วย Docker**

- มีการสร้าง Dockerfile แยกสำหรับ backend (`backend/Dockerfile_backend`) และ frontend (`frontend/Dockerfile_frontend`)
- ใช้ `docker-compose.yml` เพื่อ orchestrate การรันทั้ง backend, frontend และ nginx พร้อมกันในเครื่อง local
- ข้อดี: ลดปัญหา "it works on my machine", ทำให้การ deploy ขึ้น production ง่ายขึ้น

### 2. **CI/CD Pipeline ด้วย Jenkins**

- ใช้ `Jenkinsfile` กำหนดขั้นตอนอัตโนมัติ เช่น
  - Build Docker images
  - Run unit tests
  - Push images ไปยัง Docker registry
  - Deploy ขึ้น Kubernetes cluster
- ทุกครั้งที่มีการ push โค้ดใหม่ Jenkins จะ trigger pipeline อัตโนมัติ

### 3. **Infrastructure as Code ด้วย Kubernetes**

- มีไฟล์ manifests ในโฟลเดอร์ `k8s/` สำหรับ
  - Deployment และ Service ของ backend และ frontend
  - Ingress สำหรับ routing traffic ผ่าน Nginx
- สามารถ deploy ระบบทั้งหมดขึ้น Kubernetes cluster ได้ด้วยคำสั่ง `kubectl apply -f k8s/`

### 4. **Reverse Proxy ด้วย Nginx**

- ใช้ Nginx เป็น reverse proxy เพื่อจัดการ routing ระหว่าง frontend และ backend
- มีไฟล์ config `nginx.conf` สำหรับกำหนดเส้นทางและ security

### 5. **Configuration Management**

- ใช้ไฟล์เช่น `projects.yaml` สำหรับเก็บข้อมูล config ที่จำเป็น
- สามารถปรับแต่งค่าได้โดยไม่ต้องแก้ไขโค้ดหลัก

---

## วิธีการใช้งาน DevOps Workflow

### 1. **รันระบบแบบ Local ด้วย Docker Compose**

```bash
docker-compose up --build
```

### 2. **Deploy ขึ้น Kubernetes Cluster**

```bash
kubectl apply -f k8s/
```

### 3. **CI/CD Pipeline (Jenkins)**

- Pipeline จะรันอัตโนมัติเมื่อมีการ push โค้ดใหม่
- สามารถดูรายละเอียด pipeline ได้ใน Jenkins UI

---

## สรุป DevOps Best Practices ที่นำมาใช้

- **Automation:** ทุกขั้นตอนตั้งแต่ build, test, deploy ถูก automate ด้วย Jenkins
- **Consistency:** ใช้ Docker เพื่อให้ environment เหมือนกันทุกที่
- **Scalability:** ใช้ Kubernetes เพื่อรองรับการ scale ระบบ
- **Observability:** สามารถเพิ่ม monitoring/logging ได้ง่ายผ่าน Kubernetes และ Jenkins
- **Configuration as Code:** ทุกอย่างอยู่ในรูปแบบไฟล์ config ที่ version control ได้

---

## ข้อมูลเพิ่มเติม

- [Docker Documentation](https://docs.docker.com/)
- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

หากต้องการรายละเอียดหรือคู่มือการใช้งานเพิ่มเติม สามารถสอบถามได้ครับ! 