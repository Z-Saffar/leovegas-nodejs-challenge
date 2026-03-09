# Bruno API Collection

This folder contains the Bruno collection for testing the API.

## Setup

1. **Install Bruno** – [Download Bruno](https://www.usebruno.com/downloads)

2. **Open collection** – Bruno → **Open Collection** → select `bruno/UserChallange`

3. **Create environment** – Add an environment with a `token` variable (used by protected routes)

## Workflow

1. **Start the server:** `npm run dev`

2. **Create a user** – Run `addUser` (or use seeded admin: `admin@test.com` / `password123`)

3. **Login** – Run `Login` with valid credentials. Copy `access_token` from the response.

4. **Set token** – In your environment, set `token` = the copied access_token value

5. **Protected routes** – Run `getAllUsers`, `getUserById`, `updateUser`, `deleteUser` (they use `{{token}}`)

> **Note:** `getAllUsers` requires ADMIN role. `getUserById`, `updateUser` require owner or ADMIN. `deleteUser` requires ADMIN and cannot delete self.
