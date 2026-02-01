## 🔐 Secure Authentication System (MERN Stack)

Designed and implemented a **production-grade, security-first authentication system** using the **MERN stack**, focusing on **robust user authentication, session control, and defense-in-depth security practices**.

### Key Features

#### Authentication & Authorization
- Implemented **JWT-based authentication** with secure **access and refresh token rotation**
- Built **email verification workflow** using tokenized verification links
- Developed **OTP-based email login** for passwordless authentication
- Implemented **secure password reset flow** *(in progress)*
- Enforced **single active session per user**, automatically invalidating previous sessions
- Designed **Role-Based Access Control (RBAC)** for user and admin-level route protection

#### Security Enhancements
- Integrated **CSRF protection** using per-session CSRF tokens
- Prevented **XSS attacks** through strict input validation and schema enforcement using **Zod**
- Mitigated **NoSQL injection vulnerabilities** via query sanitization and controlled operators
- Implemented **Redis-backed rate limiting** to protect against brute-force and abuse attacks

### Tech Stack
- **Frontend:** React, Tailwind CSS  
- **Backend:** Node.js, Express.js, Nodemailer (Gmail SMTP)  
- **Database:** MongoDB  
- **Caching / Security:** Redis

