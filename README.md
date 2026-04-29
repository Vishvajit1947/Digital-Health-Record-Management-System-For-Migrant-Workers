# Digital-Health-Record-Management-System-For-Migrant-Workers

Sanjeevni — NFC Digital Health Record System

A simple and practical healthcare solution that allows patient records to travel with them — anywhere, anytime.

HealthID uses NFC technology + web platform to let doctors instantly access and update patient records with just a tap.

Why this project?

In real life, especially for migrant workers, medical records often get lost when they move between cities. This leads to:

Repeated tests
Delayed treatment
Lack of medical history

This system solves that by keeping records digitally linked to an NFC card.

How it works
Each patient gets an NFC card
The card stores a secure URL
When tapped on a phone:
Opens the system
Asks doctor to login (security)
Shows patient records instantly
Doctor can:
View history
Add diagnosis
Update risk level
 Features
 Secure Access
Login required before accessing any patient data
Role-based access (Doctor / Worker / Admin)
 NFC-Based Patient Access
Tap card → open patient record
Works on mobile browsers
 Doctor Portal
View scanned patients
Add medical records
Update patient risk level (Low / Moderate / High)
 Worker Portal
View personal health data
Track medical history
🛠 Admin Dashboard
Monitor system data
View patient distribution and analytics
 Responsive Design
Works on both desktop and mobile
 Tech Stack
Frontend
React (Vite)
Tailwind CSS
Backend / Database
Supabase (PostgreSQL + Auth)
Deployment
Vercel
Other Tools
NFC Tools (for writing URLs)
Git & GitHub
 Project Structure (Simplified)
src/
 ├── components/
 ├── pages/
 ├── hooks/
 ├── context/
 ├── App.jsx
 └── main.jsx
🔧 Installation & Setup
# Clone repo
git clone <your-repo-link>

# Install dependencies
npm install

# Run locally
npm run dev
🔐 Environment Variables

Create a .env file:

VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
📲 NFC Setup
Open NFC Tools app

Write URL to card:

https://your-app.vercel.app/patient/<id>
Tap card on phone → opens system
 Key Highlights
Real-time database updates
Secure authentication
Fast performance (Vercel optimized)
Works without installing any app
 Future Improvements
AI-based health risk prediction
Offline support
QR backup for NFC
Multi-hospital integration
 Final Note

This project was built to solve a real-world healthcare problem using simple and accessible technology.

Even though it's a student project, it has the potential to scale into a practical healthcare solution.
