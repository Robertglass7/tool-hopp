# ToolHopp

The community-powered tool rental marketplace. Perfected for web and mobile.

## Features
- **Browse Tools:** Find and filter tools by category, price, and condition.
- **Rent Tools:** Simple booking flow with AI-set pricing.
- **Hopper System:** Become a Hopper to earn by delivering and picking up tools.
- **Safety First:** Built-in reporting system and secure profiles.
- **Mobile Ready:** Powered by Capacitor for iOS and Android deployment.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Shadcn UI.
- **Backend:** Node.js, Express, Drizzle ORM, MySQL.
- **Mobile:** Capacitor.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Database

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your database URL:
   ```
   DATABASE_URL=mysql://user:password@localhost:3306/toolhopp
   ```

### Running the Project
- **Frontend (Vite):**
  ```bash
  npm run dev
  ```
- **Backend (Express):**
  ```bash
  npm run server
  ```

## App Store Deployment
This project is Capacitor-ready. To build for mobile:
```bash
npm run build
npx cap sync
npx cap open ios # or android
```
