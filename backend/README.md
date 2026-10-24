# Backend starter

This is an Express + Sequelize starter using MySQL and Sequelize CLI migrations.
It includes starter user, vehicle, purchase, and inventory models.

## Setup

```sh
npm install
cp .env.example .env
# Edit .env with your MySQL credentials and a local seed password.
npm run db:migrate
npm run db:seed
npm start
```

Create the database and a dedicated local application user in MySQL before
running migrations:

```sql
CREATE DATABASE vehicle_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vehicle_app'@'localhost' IDENTIFIED BY 'choose_a_strong_password';
GRANT ALL PRIVILEGES ON vehicle_store.* TO 'vehicle_app'@'localhost';
```

Set `DATABASE_URL` in `.env` to your local MySQL connection, for example:
`mysql://vehicle_app:choose_a_strong_password@127.0.0.1:3306/vehicle_store`.
If your password contains URL-reserved characters, percent-encode them in the
URL. Keep `.env` private; it is excluded from Git.

For tests, configure `DATABASE_TEST_URL` to a separate MySQL test database. It
does not use an in-memory database.

Set `SEED_BUYER_PASSWORD` and `SEED_ADMIN_PASSWORD` in `.env` to different,
strong local-only passwords before running `npm run db:seed`. The seeder
creates `seed_buyer` and `seed_admin` accounts using scrypt password hashes,
three sample vehicles, their inventory records, and two sample purchases for
the buyer. Re-running the seeder does not duplicate these records. Sample
seeding is blocked when `NODE_ENV=production`; do not use sample credentials
or data in a real deployment.

Remove the seeded records with `npm run db:seed:undo`.

The API listens on `http://localhost:3000` by default. `GET /health` checks
that the MySQL connection is available.

## Working with your schema

- Edit the model files in `models/` and create a migration for every schema
  change.
- Create migrations with `npm run db:migration -- --name descriptive-change`.
- Apply pending migrations with `npm run db:migrate`.
- Undo the most recently applied migration with `npm run db:migrate:undo`.

Keep schema changes in migrations; the app intentionally does not call
`sequelize.sync()` at startup. Connection URLs are read from environment
variables and are never stored in the model files.

## Starter schema

- `users` stores a unique username, a `passwordHash` (never a plaintext
  password), and a role (`buyer` or `admin`).
- `vehicles` stores the vehicle details, category (`muv`, `suv`, or `sedan`),
  and price.
- `purchases` links users and vehicles, with quantity, purchase time, and a
  unit-price snapshot so later vehicle price changes do not alter purchase
  history.
- `inventory` stores the available quantity for a vehicle. Each vehicle has at
  most one inventory row.

Purchase records are the normalized equivalent of a user's purchases array.
Use the Sequelize `purchases` association to load them with a user.
