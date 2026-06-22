# Affiliate E-Commerce Frontend

Production-ready React + Vite frontend for affiliate e-commerce platform.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Project Structure

```
src/
├── components/          # Reusable React components
├── pages/              # Page components for routes
├── layouts/            # Layout wrappers (Header, Footer)
├── hooks/              # Custom React hooks
├── context/            # React Context (Auth, etc.)
├── services/           # API service calls
├── utils/              # Utility functions
└── App.jsx             # Main app component
```

## Services

- **api.js**: Axios instance with interceptors (auth, error handling)
- **auth.service.js**: Authentication API calls
- **affiliate.service.js**: Affiliate-specific API calls

## Hooks

- **useAuth**: Custom hook for authentication state

## Components

- **ProtectedRoute**: Route guard for authenticated pages
- **Header**: Navigation header with role-based links
- **Footer**: Footer with quick links

## Pages

- **Home**: Landing page with affiliate CTA
- **Login**: User login form
- **NotFound**: 404 error page

## Environment Variables

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Affiliate E-Commerce
VITE_ENVIRONMENT=development
```

## Scripts

- `npm run dev`: Start development server (port 3000)
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## Styling

- **Tailwind CSS**: Utility-first framework
- **Custom utilities**: Buttons, badges, forms in index.css

## Features

- ✅ Authentication with JWT tokens
- ✅ Role-based routing (Customer, Affiliate, Admin)
- ✅ Automatic API token injection
- ✅ Protected routes
- ✅ Responsive design (mobile-first)
- ✅ Tailwind CSS utilities
- ✅ Error handling with interceptors
