# Roll Express takeaway billing

A red and white billing app for the takeaway counter. The React frontend helps staff choose rolls, apply a discount, save the bill, record cash/card/UPI payment, and print a receipt. The Spring Boot API stores menu items and bills in a local H2 database.

## Run on another laptop

These steps work in a terminal on macOS or Linux, or in PowerShell on Windows. Install:

- Java 21 (check with `java -version`)
- Maven 3.6.3 or newer (check with `mvn -version`)
- Node.js 22.12+ or 20.19+ and npm (check with `node -v` and `npm -v`)

Get the project on the laptop by cloning its [GitHub repository](https://github.com/ShrutiSingh-89/roll-express-reception) or downloading its ZIP from **Code → Download ZIP**. For a private repository, sign in to the GitHub account with access first. To clone:

```sh
git clone https://github.com/ShrutiSingh-89/roll-express-reception.git
cd roll-express-reception
```

If you downloaded the ZIP, open a terminal in the extracted project folder, the one containing `backend/` and `frontend/`.

Start the API in the first terminal:

```sh
cd backend
mvn spring-boot:run
```

Keep it running. Open a second terminal in the project folder and start the frontend:

```sh
cd frontend
npm ci
npm run dev
```

Open `http://127.0.0.1:5173` on that laptop. The API runs at `http://127.0.0.1:8080`; Vite forwards `/api` requests to it. Keep both terminals open while using the app. Run the backend from `backend/`, because its database path is relative to that folder. If Maven on a particular laptop stalls at an Oracle snapshot mirror, try `mvn -s maven-settings.xml spring-boot:run` from `backend/`.

### Move existing bills and menu changes

The file-based H2 database is in `backend/data/restaurantdb.mv.db`. A fresh clone starts with a new database and the default roll menu. To move your existing bills, bill numbers, prices, and menu edits, **stop the backend on both laptops**, then copy all `backend/data/restaurantdb*` files from the old laptop into `backend/data/` on the new one before starting it. Keep a separate backup of those files and back them up regularly. The database is excluded from GitHub, so cloning the repository alone does not transfer bill history. Do not run two independent databases for the same restaurant: bill number uniqueness is guaranteed only within one database.

The receipt restaurant name in **Settings** is saved in each browser, so enter it again on a new laptop or browser.

### Build and check

From `backend/`, run `mvn test` for API tests or `mvn package` to build `target/reception-0.0.1-SNAPSHOT.jar`. From `frontend/`, run `npm run build` to build the static frontend in `dist/`. The run commands above are the simplest way to use this local app; the built frontend needs a web server configured to forward `/api` to the backend.

## App data and use

On first start, the API adds the veg and non-veg rolls transcribed from the supplied menu photo. It also replaces the original untouched demo items when upgrading an existing local database. Edited or custom items and historical bills are preserved. Edit menu entries and prices in **Menu items**. Bills and menu changes are stored in `backend/data/restaurantdb*` and survive restarts. Keep a backup of that directory once using real data.

## Reception flow

1. Optionally enter a customer name for the receipt.
2. Search the roll menu and add items. Adjust quantities and discount in the order panel.
3. Choose cash, card, or UPI, then select **Save & record payment**. Or save the bill unpaid and collect payment later from **Bills & payments**.
4. Print or reprint a receipt from the bill details window.

The API calculates and stores final amounts using decimal arithmetic; the browser total is a preview. New bills are always takeaway and have no tax. Current currency is INR. The receipt restaurant name is editable in **Settings** and saved in the current browser.

The backend uses Spring Boot 4.1.1 and H2. The frontend uses React 19 and Vite 7. This is an initial local reception app; access control, shared restaurant settings, and production database operations are future work before exposing it on a public network.
