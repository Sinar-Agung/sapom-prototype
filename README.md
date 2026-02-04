# SAPOM Form Input Pesanan

Order management system prototype for SAPOM with multi-role support (Sales, Stockist, JB).

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- pnpm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd "SAPOM Form Input Pesanan (1)"
   ```

2. **Install pnpm** (if not already installed)
   ```bash
   npm install -g pnpm
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Start the development server**
   ```bash
   pnpm run dev
   ```

   The application will be available at `http://localhost:5174/`

## 📁 Project Structure

```
src/
├── app/
│   ├── components/      # React components
│   │   ├── ui/         # Reusable UI components (shadcn/ui)
│   │   ├── order-form.tsx
│   │   ├── my-orders.tsx
│   │   ├── stockist-home.tsx
│   │   └── ...
│   ├── data/           # Data models and constants
│   ├── utils/          # Utility functions
│   └── App.tsx         # Main app component
├── assets/
│   └── images/         # Product images
└── styles/             # CSS styles
```

## 🔑 Default Login Credentials

### Sales User
- Username: `sales1`
- Password: `password`

### Stockist User
- Username: `stockist1`
- Password: `password`

### JB User
- Username: `jb1`
- Password: `password`

## 🛠️ Technology Stack

- **Frontend Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS 4.1.12
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React useState + sessionStorage

## 📝 Key Features

- Multi-role authentication (Sales, Stockist, JB)
- Order creation and management
- Real-time status tracking
- Stock verification workflow
- Mobile-responsive design with FLIP animations
- Tab-based order filtering
- Image upload for model products

## 🖼️ Image Assets

Placeholder images are located in `src/assets/images/`. Replace these 1x1 pixel placeholders with actual product images:
- italy-santa.png
- italy-kaca.png
- italy-bambu.png
- kalung-flexi.png
- sunny-vanessa.png
- hollow-fancy-nori.png
- milano.png
- tambang.png
- casteli.png

## 📄 Original Design

The original Figma design is available at: https://www.figma.com/design/lqr4lJeAWAUX62129MIePY/SAPOM-Form-Input-Pesanan

## 🤝 Contributing

This is a prototype project. For any questions or issues, please contact the development team.
