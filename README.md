# LNMIIT Library Management System 📚

A modern, responsive, and fully featured Library User Management module built for LNMIIT. This project handles role-based authentication, user profiles, and administrative control over book issuances, utilizing a sleek design system.

## 🚀 Features

### Authentication & Authorization
* **Role-based Access Control:** Supports `Student`, `Faculty`, and `Admin` roles.
* **Secure Login:** JSON Web Token (JWT) based authentication with bcrypt password hashing.
* **Role Enforcement:** Dedicated "Login As" dropdown ensures users cannot access unauthorized roles.
* **Deactivation:** Admins can deactivate user accounts instantly.

### User Dashboard & Profiles
* **Dynamic Profiles:** Users can view their personal details, ID numbers, and track their currently issued books.
* **Profile Management:** Students and Faculty can update their contact details (Phone, Address).
* **Password Management:** Secure password change functionality.

### Admin Book Issuance System
* **Admin-Exclusive Issuance:** To maintain library integrity, only Admins can issue books to users via the User Management Dashboard.
* **Role Limits:** System automatically enforces limits (e.g., Students max 3 books, Faculty max 5 books).
* **Automated Overdue Tracking:** "Lazy Evaluation" architecture automatically flags pending books as `Late Fees Required` if their return date has passed when viewed.
* **Status Overrides:** Admins have a direct dropdown UI to manually mark books as `Returned`.

### UI/UX Highlights
* **Premium Design System:** Glassmorphism, tailored color palettes, and smooth micro-animations.
* **Universal Dark/Light Mode:** A persistent theme toggle (☀️/🌙) available on every page, remembering user preferences via `localStorage`.
* **Toast Notifications:** Clean, non-intrusive feedback alerts for all user actions.
* **Fully Responsive:** Adapts perfectly to mobile, tablet, and desktop screens.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, Vanilla CSS3 (Custom Design System with CSS Variables), Vanilla JavaScript (ES6+).
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB (via Mongoose ODM).
* **Local Server:** `serve` (for clean URLs on the frontend).

---

## ⚙️ Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your machine. You will also need a MongoDB database (local or Atlas URI).

### 1. Clone the Repository
```bash
git clone https://github.com/KartikMantri/LNMIIT_LMS.git
cd LNMIIT_LMS
```

### 2. Install Dependencies
This project uses a unified package structure for simplicity.
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

### 4. Database Seeding (Optional)
To instantly generate a System Admin account to test the system:
```bash
node backend/seed.js
```
* **Default Admin ID:** `admin`
* **Default Admin Password:** `password123`

### 5. Start the Servers
You will need to run the backend API and the frontend server simultaneously. Open two separate terminals:

**Terminal 1 (Backend API):**
```bash
npm run dev:backend
```

**Terminal 2 (Frontend):**
```bash
npm run dev:frontend
```

Now, open your browser and navigate to `http://localhost:3000/login` to access the application!

---

## 🤝 Contributing
Since this is a specific module for the LNMIIT Library Management System, Its contributors include
```
Aarohi Sinha, 
Nandini Sharma, 
Garv Jain
```
