
# Advanced Databases (NoSQL) — Backend Project Documentation

---


## 1. Project Overview

This project is a backend system for an online store, developed as part of the “Advanced Databases (NoSQL)” course. The main goal is to demonstrate modern approaches to designing and implementing a REST API using MongoDB, including advanced NoSQL patterns: aggregation pipelines, compound indexes, embedded and referenced documents, and complex update/delete operations.

The project demonstrates:
- The use of MongoDB as the primary NoSQL DBMS for e-commerce
- Mongoose for data modeling and validation
- Implementation of business logic for an online store with NoSQL-specific features
- Secure authentication and role-based access control

## 2. System Architecture


The architecture follows the client → REST API (Express) → MongoDB pattern:
- **Express.js** implements the REST API, handles HTTP requests, manages middleware and routing.
- **MongoDB** serves as the main database, providing storage and fast data access.
- **Mongoose** is used for schema definition, validation, working with embedded/referenced models, and index management.

**Data Flow:**
1. The client sends an HTTP request to the API (e.g., to create an order).
2. Express processes the request, validates data, and checks access rights.
3. Mongoose performs operations with MongoDB (CRUD, aggregations, updates).
4. The result is returned to the client in JSON format.

## 3. Database Schema Description


### users
- Main fields: email, password (hash), role (user/admin), createdAt
- Embedded: none
- Referenced: none
- **Rationale:** User is an independent entity, does not require embedded documents.

### products
- Main fields: name, description, price, categoryId, variants[], isActive
- Embedded: variants[] (array of product variants: size, color, stock)
- Referenced: categoryId (ref: categories)
- **Rationale:** Product variants (sizes, colors) are embedded for atomicity and always retrieved with the product. Category is referenced as it is shared among many products.

### categories
- Main fields: name, description
- Embedded: none
- Referenced: none
- **Rationale:** Categories are independent reference data.

### carts
- Main fields: userId, items[]
- Embedded: items[] (productId, size, quantity, priceSnapshot)
- Referenced: userId (ref: users), productId (inside items)
- **Rationale:** Cart is always associated with a user (referenced), cart items are embedded for fast access.

### orders
- Main fields: userId, items[], totalPrice, status, createdAt
- Embedded: items[] (productId, size, quantity, price)
- Referenced: userId (ref: users), productId (inside items)
- **Rationale:** Order is linked to a user (referenced), order items are embedded for atomicity and price snapshot.

## 4. MongoDB Operations


### 4.1 CRUD Operations
- **users:** registration, authentication (Create, Read)
- **products:** add, view, update, delete (CRUD)
- **categories:** add, view, delete (CRUD)
- **carts:** add/remove items, clear cart (Update, Delete)
- **orders:** place order, view history (Create, Read)


### 4.2 Advanced Update and Delete
- Operators used: `$set`, `$inc`, `$push`, `$pull`, positional operator `$`
- Examples:
   - Update product variant stock: `$inc: { "variants.$.stock": delta }`
   - Clear cart: `$set: { items: [] }`
   - Add item to cart: `$push: { items: ... }`
   - Remove item: `$pull: { items: { ... } }`
- Business rules:
   - Prevent deletion of a product if it is used in orders
   - Prevent deletion of a category if it is referenced by products


### 4.3 Aggregation Framework
- Multi-stage aggregation pipeline is used for order statistics:
   - `$match` — filter by userId
   - `$group` — group by order status, count and sum totals
   - `$project` — format the result
- Business scenario example: get user order statistics by status (created, paid, cancelled), analyze revenue.

## 5. REST API Documentation


### Auth
- `POST   /api/v1/auth/register` — user registration
- `POST   /api/v1/auth/login` — authentication

### Products
- `GET    /api/v1/products` — list products
- `POST   /api/v1/products` — create product (admin)
- `PATCH  /api/v1/products/:id` — update product (admin)
- `DELETE /api/v1/products/:id` — delete product (admin, if not used)
- `PATCH  /api/v1/products/:id/variant/stock` — update variant stock (admin)

### Cart
- `GET    /api/v1/cart` — get user cart
- `POST   /api/v1/cart/add` — add item to cart
- `POST   /api/v1/cart/remove` — remove item from cart
- `DELETE /api/v1/cart/clear` — clear cart

### Orders
- `POST   /api/v1/orders` — place order
- `GET    /api/v1/orders/my` — user order history
- `GET    /api/v1/orders/stats/status` — order statistics by status

### Stats
- `GET    /api/v1/stats/...` — additional statistical data (extensible)


## 6. Indexing and Query Optimization
- **Compound indexes:**
   - `products: { categoryId: 1, price: 1 }` — speeds up filtering and sorting products by category and price
   - `orders: { userId: 1, createdAt: -1 }` — speeds up user order history queries
- **Single-field indexes:**
   - `products: { "variants.size": 1 }`
   - `orders: { status: 1 }`
- **Rationale:** Indexes are chosen to optimize the most frequent queries (catalog, order history, status filtering), which is critical for e-commerce performance.


## 7. Authentication and Authorization
- **JWT** is used for user authentication, token is sent in the Authorization header.
- **Roles:** user/admin, role is stored in the user profile.
- **Authorization:**
   - Access to admin endpoints is restricted (admin middleware)
   - Regular users can only access their own cart and orders


## 8. Environment Configuration
- `.env` file is used to store sensitive data and configuration:
   - `MONGO_URI` — MongoDB connection string
   - `JWT_SECRET` — JWT signing secret
   - `PORT` — server port
- All environment variables are validated at application startup.


## 9. Conclusion

This project implements a full-featured backend for an online store using modern MongoDB and Mongoose capabilities. The project demonstrates:
- Proper schema design using embedded and referenced documents
- Implementation of complex business rules via advanced update/delete and aggregation pipelines
- Efficient indexing for query optimization
- Secure authentication and role-based access control

All requirements of the “Advanced Databases (NoSQL)” course are fully met. The project follows NoSQL best practices and can serve as a reference for e-commerce backend development on MongoDB.
