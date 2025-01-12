# Bookstore API

This is a RESTful API for managing an online bookstore. It allows customers to manage their carts, browse books, and place orders.

## Features
- Add, list, update, and remove items in the cart.
- Browse and search books.
- Place orders and view order history.

## Installation
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with the required environment variables.
4. Start the server: `npm start`.

## Endpoints
- `GET /cart`: List cart items.
- `POST /cart/add`: Add an item to the cart.
- `DELETE /cart/remove`: Remove an item from the cart.
- `PUT /cart/update`: Update the quantity of an item in the cart.

## License
MIT

