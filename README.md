# 🏥 SahayakSetu – Smart Hospital Management System

A **production-ready backend system** designed to manage real-world hospital workflows including **appointments, queue management, prescriptions, payments, and an intelligent chatbot**.

---

## 🌐 Live Backend

🔗 https://sahayaksetu-backend.onrender.com

---

## 🚀 Key Features

### 👤 User Module

* Register / Login with JWT Authentication
* Profile Management (image + personal details)
* Book Appointments with **Slot Locking System**
* Cancel Appointments
* View Appointment History

---

### 👨‍⚕️ Doctor Module

* Secure Doctor Login
* View Assigned Patients
* Complete / Cancel Appointments
* Dashboard (earnings, patient count, stats)
* Update Profile

---

### 🎟️ Queue Management System (🔥 Core Feature)

* Token-based queue system
* Real-time patient ordering
* Status tracking:

  * waiting
  * in-progress
  * completed
  * missed

👉 Prevents double booking and manages real hospital flow efficiently

---

### 💊 Prescription System

* Doctors add prescriptions after consultation
* Structured medicine format:

  * dosage
  * frequency
  * timing
  * duration
* Linked with appointment and patient
* Patients can view prescriptions

---

### 🤖 Smart Chatbot (🔥 Advanced Feature)

* Context-aware chatbot
* Handles queries like:

  * "Mera token kya hai?"
  * "Meri turn kab aayegi?"
* Uses real-time queue data
* Personalized responses using authentication

---

### 💳 Payment Integration

* Razorpay payment gateway
* Secure payment verification
* Tracks paid/unpaid appointments

---

### 🔐 Security & Authentication

* JWT-based authentication
* Role-based access:

  * User
  * Doctor
  * Admin
* Password hashing using bcrypt
* No sensitive data exposure

---

## 🧠 System Workflow

```text id="sysflow1"
User → Book Appointment → Slot Locked
     → Queue Token Generated
     → Doctor Consultation
     → Prescription Added
     → Patient Views Data
     → Chatbot Assistance
```

---

## 🛠️ Tech Stack

| Category        | Technology          |
| --------------- | ------------------- |
| Backend         | Node.js, Express.js |
| Database        | MongoDB + Mongoose  |
| Authentication  | JWT                 |
| File Upload     | Multer + Cloudinary |
| Payments        | Razorpay            |
| Deployment      | Render              |
| Version Control | Git + GitHub        |

---

## 📁 Project Structure

```text id="folder1"
backend/
│── controllers/
│── models/
│── routes/
│── middlewares/
│── config/
│── server.js
```

---

## ⚙️ Environment Variables

Create a `.env` file:

```env id="env1"
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_key
RAZORPAY_SECRET_VALUE=your_secret
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_SECRET=your_secret
```

---

## ▶️ Run Locally

```bash id="run1"
npm install
npm run dev
```

---

## 🌐 API Base URL

```text id="baseurl1"
https://sahayaksetu-backend.onrender.com/api
```

---

## 📌 Highlights

* 🔥 Slot-locking system (prevents double booking)
* 🔥 Token-based real-time queue system
* 🔥 End-to-end hospital workflow
* 🔥 Smart chatbot with live queue intelligence
* 🔥 Clean and scalable backend architecture

---

## 🚀 Future Enhancements

* Pharmacy Module
* Staff Dashboard
* Notification System (SMS/Email)
* Video Consultation
* AI-based diagnosis assistance

---

## 👨‍💻 Author

**Deepu Gupta**
📍 Greater Noida, India
💼 Full Stack Developer (MERN)

---

## ⭐ Why This Project?

This project demonstrates a **real-world scalable backend system** suitable for:

* Healthcare platforms
* Startup MVPs
* Production-ready applications
* Technical interviews

---

## 🙌 Support

If you like this project:

⭐ Star the repository
🍴 Fork it
🤝 Contribute

---
