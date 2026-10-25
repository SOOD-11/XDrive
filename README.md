# XDrive

XDrive is a full-stack dealership platform for managing vehicle inventory, customer browsing, and sales operations. It gives car dealers a simple way to list vehicles, update stock, upload photos, and let buyers search for available cars without leaving the app.
Link :  x-drive-q7lfeupud-sanchitsood3100-gmailcoms-projects.vercel.app
## Why XDrive?

XDrive is built to solve a common dealership pain point: disconnected inventory management and customer buying flow. Instead of juggling spreadsheets, static websites, or fragmented admin tools, XDrive brings the whole process into a single platform.

### USP (Unique Selling Proposition)

- Inventory-first experience: every vehicle includes details, price, stock level, image, and category.
- Role-based access: buyers can browse and purchase, while admins can manage stock, edit listings, add new cars, and upload vehicle photos.
- Live stock management: vehicle availability updates immediately as inventory changes.
- Search and filtering: shoppers can quickly narrow by maker, model, category, and price range.
- Simple dealership workflow: from listing vehicles to restocking and completing a sale in one interface.
- Secure backend: JWT-based authentication and MySQL-backed data storage.

In short, XDrive is a fast, lightweight dealership system designed for small-to-medium car businesses that need a modern, easy-to-run storefront and admin dashboard in one app.

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL with Sequelize ORM
- Authentication: JWT
- Media: image uploads for vehicle listings

## Repository structure

```text
XDrive/
├── backend/      # Express API, database models, routes, and migrations
├── frontend/     # React client for browsing and managing inventory
├── README.md     # Project overview and local setup
└── .gitignore
```

## Prerequisites

Before running XDrive locally, make sure you have:

- Node.js 18+ and npm
- MySQL installed and running locally
- A MySQL user with permission to create a database

## Quick start

### 1) Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and configure your local database credentials.

Example values:

```env
PORT=3000
DATABASE_URL=mysql://vehicle_app:your_password@127.0.0.1:3306/vehicle_store
DATABASE_TEST_URL=mysql://vehicle_app:your_password@127.0.0.1:3306/vehicle_store_test
SEED_BUYER_PASSWORD=yourStrongBuyerPassword
SEED_ADMIN_PASSWORD=yourStrongAdminPassword
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Create the MySQL database and user:

```sql
CREATE DATABASE vehicle_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vehicle_app'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON vehicle_store.* TO 'vehicle_app'@'localhost';
FLUSH PRIVILEGES;
```

Then run the database migrations and seed sample data:

```bash
npm run db:migrate
npm run db:seed
```

Start the backend API:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

### 2) Set up the frontend

Open a second terminal and run:

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

The app will usually be served at:

```text
http://localhost:5173
```

## Default login flow

Once the database is seeded, the app creates sample accounts using the values from `backend/.env`.

- Buyer account: `seed_buyer`
- Admin account: `seed_admin`

Use the passwords set in:

- `SEED_BUYER_PASSWORD`
- `SEED_ADMIN_PASSWORD`

## Features in the app

### Buyer experience

- Register and log in
- Search for vehicles by maker, model, category, and price
- View vehicle images and stock availability
- Purchase available vehicles

### Dealer/admin experience

- Add new vehicles to inventory
- Edit existing vehicle details
- Delete listings
- Restock inventory
- Upload vehicle photos

## Useful scripts

### Backend

```bash
npm run dev      # start backend in watch mode
npm run start    # start backend once
npm run db:migrate
npm run db:seed
npm run db:seed:undo
```

### Frontend

```bash
npm run dev      # launch Vite dev server
npm run build    # create production build
npm run preview  # preview the production build
```

## Notes

- The backend uses `sequelize.sync()` is intentionally avoided; schema changes should be managed with migrations.
- Keep `.env` files private and do not commit them to Git.
- Cloudinary variables are optional for image upload workflows, depending on how the backend is configured for media storage.

- 

## Summary

XDrive is a practical dealership management solution that combines vehicle inventory, search, sales, and admin controls into one streamlined system. It is designed for sellers who want to manage stock efficiently while giving buyers a clean and simple way to browse and purchase cars.

If you want, I can also replace the generic `frontend/README.md` and `backend/README.md` with a cleaner, project-specific version that matches this root documentation.
