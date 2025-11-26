# Knesty Portal - Sunday School Management System

Knesty Portal is a comprehensive, modern web application designed to manage Sunday School operations, including servants, students, classes, attendance, and a points-based store system. Built with performance and user experience in mind, it leverages Server-Side Rendering (SSR) and a robust component architecture.

## 🚀 Features

- **Servant Management**: Complete profile management for church staff and teachers with role-based access control.
- **Church Administration**: Manage multiple church locations, areas, and dioceses.
- **Student Management**: (In Progress) Registration, class assignment, and attendance tracking.
- **Store System**: (Planned) Points-based marketplace for students to redeem rewards.
- **Modern UI/UX**: Responsive design with dark/light mode support, built using `shadcn/ui`.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: React Hook Form + Zod

## 📂 Project Structure

```
├── app/                  # Next.js App Router pages and layouts
│   ├── (admin)/          # Admin dashboard routes (protected)
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/               # Reusable UI components (buttons, inputs, etc.)
│   └── ...               # Feature-specific components (e.g., servant-management.tsx)
├── hooks/                # Custom React hooks (e.g., useServantManagement)
├── lib/                  # Utility functions and Supabase client setup
├── public/               # Static assets
└── utils/                # Helper functions
```

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd knesty-portal
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3070](http://localhost:3070) with your browser to see the result.

## 🏗️ Architecture Highlights

- **Server-Side Rendering (SSR)**: The application prioritizes SSR for better performance and SEO. Server Components handle data fetching and layout structure, while Client Components manage interactivity.
- **Supabase Integration**: Direct integration with Supabase for authentication and database operations, utilizing Row Level Security (RLS) for data protection.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.
