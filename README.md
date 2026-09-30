# Ads Manager - Frontend

This is the Next.js 14 frontend for the AI-Powered Amazon Ads Management Platform.

## Prerequisites
- Node.js (v18 or higher)
- [pnpm](https://pnpm.io/) package manager

## Environment Variables
Copy `.env.example` to `.env` and set your backend URL:
```bash
cp .env.example .env
```
Ensure `NEXT_PUBLIC_API_URL` points to your running backend (e.g., `http://localhost:8000`).

## Running Locally

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```
The app will be available at `http://localhost:3000`.

**Note:** The backend (API) must be running separately for authentication and data fetching to work. See the `ads-backend` repository instructions to start the API and database.
