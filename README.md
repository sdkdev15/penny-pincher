# Penny Pincher

A powerful and intuitive personal finance application designed to help you take control of your money. Track your income and expenses, set personalized budgets, generate reports, and scan receipts with OCR technology.

---

## Features

### Core Features
- **Transaction Management**: Add, edit, delete, and view income and expense transactions
- **Category Management**: Organize transactions into categories with budget limits
- **Receipt Scanning**: OCR-powered receipt scanning using Tesseract (Indonesian language support)
- **Financial Reports**: Generate detailed reports with charts and visualizations
- **Data Export**: Export financial data to CSV and PDF formats
- **Multi-Currency Support**: Track transactions in different currencies with automatic conversion
- **Dashboard**: Real-time summary of your financial status

### Authentication & Security
- User registration and login with JWT authentication
- Password hashing with bcrypt
- Admin features for user management
- Protected API routes with middleware

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Charts**: Recharts
- **Receipt OCR**: Python FastAPI service with Tesseract OCR
- **AI Integration**: Genkit with Google AI
- **PDF Generation**: jsPDF with autoTable
- **Image Processing**: html2canvas, Tesseract.js (client-side OCR)

---

## Project Structure

```
penny-pincher/
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── receipt-scan/             # Python OCR service
│   ├── app.py                # FastAPI application
│   ├── utils/                # OCR utilities
│   ├── requirements.txt      # Python dependencies
│   └── README.md             # Receipt service documentation
├── scripts/
│   ├── run-migrations.sh     # Migration runner script
│   └── seed-admin.ts         # Admin user seeder
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/              # API routes (App Router)
│   │   │   ├── auth/[...nextauth]/  # NextAuth routes
│   │   │   └── process/receipts/scan/  # Receipt scanning API
│   │   ├── categories/       # Categories page
│   │   ├── login/            # Login page
│   │   ├── reports/          # Reports page
│   │   ├── scanReceipts/     # Receipt scanner page
│   │   ├── transactions/     # Transactions page
│   │   └── users/            # User management page
│   ├── components/           # React components
│   │   ├── categories/       # Category components
│   │   ├── dashboard/        # Dashboard widgets
│   │   ├── layout/           # Layout components
│   │   ├── reports/          # Report components
│   │   ├── transactions/     # Transaction components
│   │   └── ui/               # shadcn/ui components
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.tsx   # Authentication state
│   │   ├── CurrencyContext.tsx  # Currency settings
│   │   └── ThemeContext.tsx  # Theme settings
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts        # Authentication hook
│   │   ├── useCategories.ts  # Categories hook
│   │   ├── useCurrency.ts    # Currency hook
│   │   ├── useTheme.ts       # Theme hook
│   │   └── useTransactions.ts # Transactions hook
│   ├── lib/                  # Utility libraries
│   │   ├── authOptions.ts    # NextAuth configuration
│   │   ├── constants.ts      # App constants
│   │   ├── env.ts            # Environment variables
│   │   ├── logger.ts         # Logging utility
│   │   ├── prisma.ts         # Prisma client
│   │   ├── types.ts          # TypeScript types
│   │   ├── utils.ts          # Utility functions
│   │   └── validators.ts     # Zod validators
│   ├── middleware/           # Next.js middleware
│   │   └── authMiddleware.ts # Authentication middleware
│   └── pages/                # Legacy Next.js pages
│       └── api/              # Legacy API routes
│           ├── auth/         # Authentication endpoints
│           └── process/      # Transaction/Category endpoints
├── public/                   # Static assets
├── docker-compose.yaml       # Production Docker configuration
├── dev-compose.yaml          # Development Docker configuration
├── Dockerfile                # Container build file
└── package.json              # NPM dependencies
```

---

## API Endpoints

### Authentication (src/pages/api/auth/)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| DELETE | `/api/auth/delete` | Delete user account |
| PUT | `/api/auth/update` | Update user password |
| GET | `/api/auth/user` | Get current user |
| GET | `/api/auth/users` | List all users (admin) |

### Transactions (src/pages/api/process/transactions/)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/process/transactions` | List user transactions |
| POST | `/api/process/transactions` | Create transaction |
| GET | `/api/process/transactions/:id` | Get transaction |
| PUT | `/api/process/transactions/:id` | Update transaction |
| DELETE | `/api/process/transactions/:id` | Delete transaction |

### Categories (src/pages/api/process/categories/)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/process/categories` | List user categories |
| POST | `/api/process/categories` | Create category |
| GET | `/api/process/categories/:id` | Get category |
| PUT | `/api/process/categories/:id` | Update category |
| DELETE | `/api/process/categories/:id` | Delete category |

### Receipt Scanning (src/app/api/process/receipts/scan/)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/process/receipts/scan` | Scan receipt image |

---

## Database Schema

### User
- `id`: Auto-increment ID
- `username`: Unique username
- `password`: Hashed password
- `isAdmin`: Admin flag
- `createdAt`, `updatedAt`: Timestamps

### Transaction
- `id`: Auto-increment ID
- `type`: "income" or "expense"
- `amount`: Transaction amount
- `categoryId`: Associated category
- `userId`: Associated user
- `date`: Transaction date
- `notes`: Optional notes
- `receiptImage`: Receipt image path
- `receiptData`: OCR extracted data (JSON)
- `scannedFromReceipt`: Boolean flag
- `createdAt`, `updatedAt`: Timestamps

### Category
- `id`: Auto-increment ID
- `name`: Category name
- `budget`: Optional budget limit
- `isDefault`: Default category flag
- `userId`: Associated user
- `createdAt`, `updatedAt`: Timestamps

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐         ┌─────────────────┐
│      User       │         │    Category     │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ username        │         │ name            │
│ password        │         │ budget          │
│ isAdmin         │    1    │ isDefault       │
│ createdAt       ├────────►│ userId (FK)     │
│ updatedAt       │    N    │ createdAt       │
└─────────────────┘         │ updatedAt       │
        │                   └─────────────────┘
        │ 1
        │
        ▼ N
┌─────────────────┐         ┌─────────────────┐
│   Transaction   │    N    │    Category     │
├─────────────────┤◄────────│                 │
│ id (PK)         │    1    │                 │
│ type            │         │                 │
│ amount          │         │                 │
│ categoryId (FK) │         │                 │
│ userId (FK)     │         │                 │
│ date            │         │                 │
│ notes           │         │                 │
│ receiptImage    │         │                 │
│ receiptData     │         │                 │
│ scannedFromReceipt          │                 │
│ createdAt       │         │                 │
│ updatedAt       │         │                 │
└─────────────────┘         └─────────────────┘
```

**Relationships:**
- User → Transaction: One-to-Many (1:N)
- User → Category: One-to-Many (1:N)
- Transaction → Category: Many-to-One (N:1)

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- Docker (optional, for containerized setup)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sdkdev15/penny-pincher.git
   cd penny-pincher
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/penny_pincher
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=1d
   ```

4. **Set up the database:**
   ```bash
   npm run build
   ```
   Or run migrations manually:
   ```bash
   npx prisma migrate dev
   ```

5. **Run the application:**
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:9003

### Docker Setup

**Development:**
```bash
docker-compose -f dev-compose.yaml up -d
```

**Production:**
```bash
docker-compose up -d
```

---

## Receipt Scanning Service

The receipt scanning feature uses a separate Python FastAPI service:

- **Health Check**: `GET http://localhost:8000/health`
- **Scan Receipt**: `POST http://localhost:8000/scan`
- **Indonesian Language Support**: Tesseract OCR with `ind` and `eng` models

The service extracts:
- Store name
- Date
- Line items
- Total amount
- Raw text

See `receipt-scan/README.md` for detailed documentation.

---

## Development

### Available Scripts
```bash
npm run dev      # Start development server (port 9003)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript check
```

### Creating Admin User
```bash
npx tsx scripts/seed-admin.ts
```

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Add feature-name"`
4. Push to the branch: `git push origin feature-name`
5. Open a Pull Request

---

## License

MIT License