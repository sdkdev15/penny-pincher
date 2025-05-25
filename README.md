---

# Penny Pincher

Penny Pincher is a powerful and intuitive personal finance app designed to help you take control of your money. With Penny Pincher, you can easily track your income and expenses, set personalized budgets, and visualize your financial progress—all in one place. Whether you're saving for a big goal or just want to understand your spending habits, Penny Pincher provides the tools and insights you need to make smarter financial decisions.

---

## Project Status

Penny Pincher is currently in active development. The core features—such as tracking income and expenses, categorizing transactions, generating reports, and setting budgets—are implemented and functional. The app is stable for basic personal finance management and is ready for early adopters to try out and provide feedback.

---

## Roadmap

Planned improvements and future features include:

- Adding support for recurring transactions
- Enhanced data visualization and analytics
- Multi-currency support
- Improved security and data encryption
- Customizable categories and tags
- Scan and import data from receipts
- Alert menu to setting up your email/telegram for sending your monthly report

Your feedback and contributions are welcome to help shape the future of Penny Pincher!

---

## Features

- **Track Transactions**: Add, edit, delete, and view income and expense transactions.
- **Categorize Transactions**: Organize transactions into categories for better financial insights.
- **Budget Management**: Set and monitor budgets for different categories.
- **Reports**: Generate detailed financial reports, including income vs. expenses and category breakdowns.
- **Multi-Currency Support**: Track transactions in different currencies with automatic conversion.
- **Export Data**: Export your financial data to CSV for further analysis or backup.
- **User Authentication**: Securely register, log in, and manage your account.
- **Admin Features**: Manage users and access admin-only features.
- **Responsive Design**: Optimized for desktop and mobile devices.

---

## Getting Started

1. **Clone the repository:**
    ```bash
    git clone https://github.com/sdkdev15/penny-pincher.git
    cd penny-pincher
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Set up the database:**
    - Ensure you have PostgreSQL installed and running.
    - Update the .env file with your database connection string:
      ```
      DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>
      JWT_SECRET=your_jwt_secret
      JWT_EXPIRES_IN=1d
      ```
    - Run Prisma migrations:
      ```bash
      npx prisma migrate dev
      ```

4. **Run the application:**
    ```bash
    npm run dev
    ```

---

## Project Structure

```
penny-pincher/
├── prisma/                # Prisma schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── api/               # API routes for authentication, transactions, and categories
│   │   ├── auth/          # Authentication-related routes (e.g., login, register, delete)
│   │   ├── transactions/  # Transaction-related routes
│   │   └── categories/    # Category-related routes
│   ├── app/               # Next.js app directory
│   │   ├── users/         # User management page (admin-only)
│   │   ├── transactions/  # Transactions page
│   │   └── categories/    # Categories page
│   ├── components/        # React components
│   │   ├── layout/        # Layout components (e.g., SidebarNav)
│   │   ├── ui/            # Reusable UI components (e.g., buttons, modals, tables)
│   │   ├── categories/    # Category management components
│   │   ├── transactions/  # Transaction management components
│   │   └── reports/       # Financial reports components
│   ├── contexts/          # React context providers (e.g., AuthContext, ThemeContext)
│   ├── hooks/             # Custom React hooks (e.g., useAuth, useTheme)
│   ├── lib/               # Utility libraries (e.g., constants, Prisma client)
│   ├── pages/             # Next.js pages
│   │   ├── api/           # API routes
│   │   ├── index.tsx      # Home page
│   │   └── login.tsx      # Login page
│   ├── styles/            # Global and component-specific styles
│   └── utils/             # Utility functions
├── public/                # Static assets
│   └── images/
├── .env                   # Environment variables
├── package.json
├── README.md
└── tsconfig.json          # TypeScript configuration
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Log in a user and return a JWT.
- `POST /api/auth/logout`: Log out a user (client-side token removal).
- `DELETE /api/auth/delete`: Delete the authenticated user's account.
- `PUT /api/auth/update`: Update the authenticated user's password.
- `GET /api/auth/user`: Get the authenticated user's details.
- `GET /api/auth/users`: Get a list of all users (admin-only).

### Transactions
- `GET /api/transactions`: List all transactions.
- `POST /api/transactions`: Create a new transaction.
- `GET /api/transactions/:id`: Get a single transaction by ID.
- `PUT /api/transactions/:id`: Update a transaction by ID.
- `DELETE /api/transactions/:id`: Delete a transaction by ID.

### Categories
- `GET /api/categories`: List all categories.
- `POST /api/categories`: Create a new category.
- `GET /api/categories/:id`: Get a single category by ID.
- `PUT /api/categories/:id`: Update a category by ID.
- `DELETE /api/categories/:id`: Delete a category by ID.

---

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature-name"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License.

---
