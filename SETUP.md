# KK360 Setup Guide

This guide will help you set up the Karpom Karpippom (KK360) application system.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (Atlas or local instance)
- npm or yarn

## Backend Setup

### 1. Navigate to backend directory

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kk360?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# SendGrid Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@kk360.com

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Create uploads directory

```bash
mkdir -p uploads/applications
```

### 5. Start the backend server

```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

## Frontend Setup

### 1. Navigate to frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env.local` file

Create a `.env.local` file in the `frontend` directory:

```env
# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production

# Environment
NODE_ENV=development
```

### 4. Start the frontend development server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features Implemented

### 1. Home Page & Application System

- ✅ Bilingual interface (English & Tamil)
- ✅ Auto-generated Application ID (format: KK2025-XXXXX)
- ✅ Email/SMS notification on submission
- ✅ PDF generation for admin
- ✅ File upload support (photo, marksheet, income certificate, ID proof)

### 2. Application Form

- ✅ Multi-step form with validation
- ✅ Personal information
- ✅ Educational information
- ✅ Family information
- ✅ Document uploads
- ✅ Bilingual support

### 3. Backend API

- ✅ Application submission endpoint: `POST /api/applications/submit`
- ✅ Application status check: `GET /api/applications/status/:applicationId`
- ✅ File upload handling with Multer
- ✅ PDF generation service
- ✅ Notification service (Email & SMS)

## API Endpoints

### Applications

### Study Materials & Flashcards

- `POST /api/tutor/study-materials` - (Tutor) create study material metadata (title, url, subjects)
- `GET /api/study-materials` - list study materials (optional `?subject=` filter)
- `POST /api/tutor/study-materials/upload` - (Tutor) upload a file (video/image/pdf)
- `GET /api/tutor/study-materials/my` - (Tutor) list own uploaded materials
- `PUT /api/tutor/study-materials/:id` - (Tutor) update material metadata (title/description/subjects/url)
- `POST /api/tutor/flashcards` - (Tutor) create a flashcard set with questions and choices
- `GET /api/flashcards/quick?n=3&subject=` - fetch a quick quiz of n questions (default n=3)
- `POST /api/flashcards/responses` - save quick quiz responses from students

### Health Check

## Database Models

### Application Model

- `applicationId` - Auto-generated unique ID
- `personalInfo` - Personal details
- `educationalInfo` - Educational details
- `familyInfo` - Family information
- `documents` - File paths
- `status` - Application status (pending, tele-verification, panel-interview, selected, rejected)

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**

   - Verify your `MONGODB_URI` in `.env`
   - Check network connectivity
   - Ensure MongoDB Atlas IP whitelist includes your IP

2. **File Upload Errors**

   - Ensure `uploads/applications` directory exists
   - Check file size limits (10MB default)
   - Verify multer configuration

3. **Email/SMS Not Sending**
   - Verify SendGrid API key
   - Verify Twilio credentials
   - Check environment variables

### Frontend Issues

1. **API Connection Error**

   - Verify `NEXT_PUBLIC_API_URL` in `.env.local`
   - Ensure backend is running
   - Check CORS settings in backend

2. **Frontend `npm start` exit code 1**

   - `npm start` runs `next start` which requires a production build (run `npm run build` then `npm start`).
   - For development use `npm run dev` which starts Next.js in dev mode with automatic reloads.
   - If you see exit code 1 after `npm start`, try `npm run dev` instead.

3. **Translation Not Working**
   - Ensure `ta.json` exists in `src/locales/`
   - Check i18n configuration

## Next Steps (To Be Implemented)

1. **Televerification System**

   - Volunteer registration
   - Student-volunteer assignment
   - Evaluation forms

2. **Panel Interview System**

   - Time slot booking
   - Panel member registration
   - Meeting link generation
   - Student-panel allocation

3. **Dashboard System**

   - Admin dashboard
   - Tutor dashboard
   - Student dashboard
   - Test conducting team dashboard

4. **Additional Features**
   - Real-time chat
   - Attendance tracking
   - Assignment submission
   - Test management
   - Analytics and reporting

## Support

For issues or questions, please contact the development team.
