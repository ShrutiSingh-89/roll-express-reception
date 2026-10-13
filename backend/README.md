# Roll Express reception API

Requires Java 21 and Maven 3.6.3 or newer. From `backend/`, run:

```sh
mvn spring-boot:run
```

If this machine's Maven settings try an unavailable Oracle snapshot repository first, use `mvn -s maven-settings.xml spring-boot:run` to resolve dependencies directly from Maven Central.

The API listens on `http://localhost:8080` and binds to `127.0.0.1` by default. Set `HOST` only if you intentionally want to change that bind address. Its H2 database is stored in `backend/data/restaurantdb.mv.db` and survives restarts. The roll menu from the supplied photo is added once. On upgrade, the nine original demo items are replaced only when all nine still match their original names, prices, categories, and availability. Other menu entries and existing bills are preserved. Staff can edit or remove menu items without them returning on restart. Run `mvn test` for the API tests.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/menu-items` | List menu items |
| POST | `/api/menu-items` | Add a menu item |
| PUT | `/api/menu-items/{id}` | Replace a menu item |
| DELETE | `/api/menu-items/{id}` | Remove a menu item |
| GET | `/api/bills` | List bills, newest first |
| GET | `/api/bills/{id}` | Read a bill |
| POST | `/api/bills` | Create an unpaid bill |
| POST | `/api/bills/{id}/pay` | Mark a bill paid |

Menu item request: `{ "name": "Veg Roll", "category": "Veg Rolls", "price": 100.00, "available": true }`.

Bill request:

```json
{
  "customerName": "Guest",
  "items": [{ "menuItemId": 1, "quantity": 2 }],
  "discountPercent": 0
}
```

`customerName` and `discountPercent` are optional; the discount defaults to 0. Every new bill is takeaway with no table number or tax. For compatibility, requests may still contain the old `serviceType`, `tableNumber`, and `taxPercent` fields, but the server ignores them. The server uses current menu prices, rounds the discount to two decimals, and saves the item prices in the bill. A created bill response includes `id`, `billNumber`, `createdAt`, `status`, line items, `subtotal`, `discountAmount`, and `total`. Legacy service and tax fields remain in responses so historical bills retain their original details; they are `TAKEAWAY` and zero for new bills.

To mark it paid, post `{ "paymentMethod": "UPI" }` to `/api/bills/{id}/pay`. Payment methods are `CASH`, `CARD`, and `UPI`. This records a payment at reception; it does not process an online transaction.
