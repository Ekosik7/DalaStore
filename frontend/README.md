# DalaStore Frontend

Modern e-commerce frontend built with React, TypeScript, and TailwindCSS.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **React Router** - Routing
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **Zod** - Validation

## Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:4000`

## Installation

```bash
cd frontend
npm install
```

## Environment Variables

Create a `.env` file (or use the existing one):

```env
VITE_API_URL=
```

Leave `VITE_API_URL` empty to use Vite proxy in development. In production, set it to your backend URL.

## Development

```bash
npm run dev
```

The app will start on `http://localhost:5173`

**Important**: Make sure the backend is running on `http://localhost:4000` before starting the frontend.

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── app/              # App setup (router, providers)
├── shared/           # Shared utilities
│   ├── api/         # API client and endpoints
│   ├── types/       # TypeScript types
│   ├── ui/          # Reusable UI components
│   └── utils/       # Utility functions
├── entities/        # Business entities (auth)
├── pages/           # Page components
│   └── admin/       # Admin pages
├── widgets/         # Layout components (Navbar, Footer)
├── index.css        # Global styles
└── main.tsx         # Entry point
```

## Features

### User Features
- Browse products with search and category filter
- View product details with variant selection
- Add products to cart
- Manage cart (update quantity, remove items)
- Create orders
- View order history

### Admin Features
- Manage categories (create, delete)
- Manage products (CRUD operations)
- Manage product variants
- Adjust stock using delta approach

## API Integration

The frontend integrates with the DalaStore backend API:

- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Categories**: `/api/categories`
- **Products**: `/api/v1/products`
- **Cart**: `/api/v1/cart`
- **Orders**: `/api/v1/orders`
- **Stats**: `/api/stats`

## Authentication

- JWT-based authentication
- Token stored in localStorage
- User data persisted in localStorage
- Automatic redirect on 401 errors
- Protected routes for authenticated users
- Admin-only routes for admin users

## Notes

- **Cart Quantity Updates**: Uses remove + add strategy (no dedicated update endpoint)
- **Product Loading in Cart**: Uses `useQueries` to load products in parallel
- **Variant Selection**: Size is the primary selector, color is displayed as readonly
- **ID Normalization**: Backend uses `_id`, frontend normalizes to `id`
- **Proxy Configuration**: Vite proxy handles `/api/*` requests in development
