
# HospiTakeAway (formerly MediOrder)

HospiTakeAway is a modern, full-stack web application designed to streamline the food ordering process within a hospital environment. It provides patients, their families, and hospital staff with a convenient way to order from nearby restaurants directly to a specific hospital bed, simplifying delivery and payment.

This project is built with a focus on user experience, leveraging QR code technology for quick, location-based ordering and providing real-time order tracking.

## ✨ Core Features

- **QR Code Ordering**: Scan a QR code at a hospital bed to automatically pre-fill delivery details, enabling a fast and error-free ordering process.
- **Restaurant Discovery**: Browse a list of nearby restaurants with options to filter by cuisine type and sort by distance.
- **Simplified Payments**: Pay for orders using the merchant's designated QR code. The app generates an order verification code to ensure payment is correctly associated with the order.
- **Real-Time Order Tracking**: Keep track of the order status from preparation to delivery, with options to confirm receipt.
- **User & Merchant Portals**: Separate dashboards for regular users to manage orders and for merchants to manage their menu, promotions, and incoming orders.
- **Admin Dashboard**: An administrative panel for overseeing merchants and QR code management.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15 (with Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) (built on Radix UI)
- **State Management**: [TanStack Query](https://tanstack.com/query) & React Context
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **AI Integration**: [Google's Genkit](https://firebase.google.com/docs/genkit)
- **QR Code Generation**: `qrcode.react`

## 📂 Project Structure

The project follows a standard Next.js App Router structure, organizing routes by their function:

```
HospiTakeAway/
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js App Router pages and layouts
│   │   ├── admin/         # Admin-facing dashboard
│   │   ├── merchant/      # Merchant-facing dashboard
│   │   ├── cart/          # Shopping cart page
│   │   ├── checkout/      # Checkout page
│   │   ├── orders/        # User's order history
│   │   ├── restaurants/   # Restaurant listings and menus
│   │   ├── scan/          # QR code scanning page
│   │   └── page.tsx       # Homepage
│   ├── components/        # Reusable UI components (Cards, Forms, etc.)
│   ├── contexts/          # Global React Context providers (Auth, Cart, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Core utilities, Firebase config, mock data
│   └── types/             # TypeScript type definitions
└── next.config.ts         # Next.js configuration
```

## ⚙️ Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- [pnpm](https://pnpm.io/) (or npm/yarn)
- A Firebase project with Firestore and Authentication enabled.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/HospiTakeAway.git
cd HospiTakeAway
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of the project and add your Firebase project configuration. You can find these keys in your Firebase project settings.

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Development Server

```bash
pnpm dev
```

The application should now be running at [http://localhost:9002](http://localhost:9002).

## 🎨 Style Guidelines

The application follows a clean, calm, and accessible design system suitable for a healthcare environment.

- **Primary Color**: `#75A3D1` (Calm Blue)
- **Background Color**: `#E8F0F7` (Soft Desaturated Blue)
- **Accent Color**: `#8EBA7D` (Gentle Green)
- **Font**: Geist Sans (a clean, readable sans-serif font)

This ensures a user-friendly interface that inspires trust and serenity.
