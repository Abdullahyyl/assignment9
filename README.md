# Assignment 9 - Reading List (Express REST API + React client)

A full-stack Reading List application: an Express 5 REST API that keeps books in memory (`server/`) and a React + Vite client that uses it (`client/`). There is no database and no login; when the server restarts the data returns to its seed.

## Install and run

You need Node.js (current LTS). Open two terminals.

**Server** (port 3000):

```
cd server
npm install
npm start            # node server.js   (npm run dev = node --watch server.js)
```

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | port the API listens on |
| `CLIENT_ORIGIN` | `http://localhost:5173` | the one origin allowed by CORS |

**Client** (port 5173):

```
cd client
npm install
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

| Variable | Example | Meaning |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/api` | base URL of the API (read with `import.meta.env`) |

Open http://localhost:5173. No Vite proxy is configured: the browser calls the API directly and the server allows it with the `cors` package. `.env` files are not committed.

## File organization

```
server/
  server.js       Express app: CORS, JSON parsing, routes, 404 fallback, error middleware
  booksStore.js   in-memory data source (async, immutable updates, seed books)
  validate.js     book validation, id parsing, query-string parsing
client/
  src/api/books.js        the only place that calls fetch
  src/components/         Filters, BookList, BookItem, BookForm, StatsPanel
  src/App.jsx             state, data loading, add/edit/toggle/rate/delete handlers
  .env.example            documents VITE_API_URL
```

## API summary

| Route | Success | Errors |
| --- | --- | --- |
| `GET /api/books` (`genre`, `read`, `q`, `sort`, `order`, `limit`, `page`) | 200 | 400 |
| `GET /api/books/:id` | 200 | 400, 404 |
| `POST /api/books` | 201 + `Location` | 400, 409 |
| `PUT /api/books/:id` (complete body) | 200 | 400, 404, 409 |
| `PATCH /api/books/:id` (only changed fields) | 200 | 400, 404, 409 |
| `DELETE /api/books/:id` | 204 | 400, 404 |
| `GET /api/stats` | 200 | - |

All errors look like `{ "error": "message" }`. The merged book of a `PATCH` goes through the same validation as a complete book. An empty `PATCH` (no known field) is a `400`.

**Deliberate crash route:** `GET /api/crash` throws inside an `async` handler to prove the error-handling middleware works. I kept it and documented it here, as the assignment allows. It answers `500 { "error": "Something went wrong" }` and the stack trace is only printed on the server.

## curl evidence

Captured against a fresh server (run on another port; shown here with port 3000). The headers `Date`, `ETag`, `Connection`, `Keep-Alive`, `X-Powered-By` and `Content-Length` were removed for brevity.

```
$ curl --include http://localhost:3000/api/stats    # BEFORE the change
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"total":7,"read":4,"unread":3,"averageRating":4.5,"byGenre":{"fiction":1,"science":2,"fantasy":2,"history":1,"non-fiction":1}}


$ curl --include 'http://localhost:3000/api/books?genre=fantasy&sort=year&order=desc'
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

[{"id":5,"title":"The Name of the Wind","author":"Patrick Rothfuss","year":2007,"genre":"fantasy","read":false,"rating":null},{"id":3,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":5}]


$ curl --include http://localhost:3000/api/books/3
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"id":3,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":5}


$ curl --include -X POST http://localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title":"Neuromancer","author":"William Gibson","year":1984,"genre":"fiction"}'
HTTP/1.1 201 Created
Access-Control-Allow-Origin: http://localhost:5173
Location: /api/books/8
Content-Type: application/json; charset=utf-8

{"title":"Neuromancer","author":"William Gibson","year":1984,"genre":"fiction","read":false,"rating":null,"id":8}


$ curl --include http://localhost:3000/api/stats    # AFTER the POST
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"total":8,"read":4,"unread":4,"averageRating":4.5,"byGenre":{"fiction":2,"science":2,"fantasy":2,"history":1,"non-fiction":1}}


$ curl --include -X POST http://localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title":"Future Book","author":"Nobody","year":3000,"genre":"fiction"}'
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"error":"year must be an integer between 1000 and 2026"}


$ curl --include 'http://localhost:3000/api/books?genre=fiction&genre=history'
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"error":"query parameter \"genre\" must be given exactly once"}


$ curl --include http://localhost:3000/api/books/999
HTTP/1.1 404 Not Found
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"error":"Book 999 not found"}


$ curl --include -X POST http://localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title":"dune","author":"FRANK HERBERT","year":1965,"genre":"fiction"}'
HTTP/1.1 409 Conflict
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"error":"A book with this title and author already exists"}


$ curl --include -X PATCH http://localhost:3000/api/books/6 -H 'Content-Type: application/json' -d '{"read":true,"rating":5}'
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"title":"Educated","author":"Tara Westover","year":2018,"genre":"non-fiction","read":true,"rating":5,"id":6}


$ curl --include -X PUT http://localhost:3000/api/books/6 -H 'Content-Type: application/json' -d '{"title":"Educated","author":"Tara Westover","year":2018,"genre":"non-fiction"}'
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"title":"Educated","author":"Tara Westover","year":2018,"genre":"non-fiction","read":false,"rating":null,"id":6}


$ curl --include -X DELETE http://localhost:3000/api/books/8
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173



$ curl --include -X DELETE http://localhost:3000/api/books/8    # repeated
HTTP/1.1 404 Not Found
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"error":"Book 8 not found"}


$ curl --include -X POST http://localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title": broken'
HTTP/1.1 400 Bad Request
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"error":"Malformed JSON in request body"}


$ curl --include http://localhost:3000/api/crash
HTTP/1.1 500 Internal Server Error
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"error":"Something went wrong"}


$ curl --include http://localhost:3000/api/nothing-here
HTTP/1.1 404 Not Found
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json; charset=utf-8

{"error":"Not found"}
```

Notes on what these show:

- **Query combination:** `genre=fantasy&sort=year&order=desc` returns only fantasy books, newest first.
- **201:** the response has `Location: /api/books/8`; the server assigned the `id`.
- **PUT versus PATCH on book 6:** `PATCH` with `{"read":true,"rating":5}` changed only those two fields. The following `PUT` with a body that left out `read` and `rating` replaced the whole book, so both went back to their defaults (`false` and `null`).
- **Delete:** the first `DELETE` gives `204` with no body; repeating it gives `404`.
- **Stats before/after:** `total` went from 7 to 8 and `byGenre.fiction` from 1 to 2 after the `POST`, with no separate counter stored: the values are computed on each request.

## Preflight evidence (CORS)

A browser sends an `OPTIONS` preflight before any request that is not "simple". My client sends `Content-Type: application/json` (and uses `PUT`, `PATCH` and `DELETE`), so the browser first sends `OPTIONS /api/books` with the headers `Origin: http://localhost:5173`, `Access-Control-Request-Method` and `Access-Control-Request-Headers: content-type`, and the actual request is only sent if the response allows it. The same preflight replayed with curl, and the response of my server:

```
$ curl --include -X OPTIONS http://localhost:3000/api/books -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type'
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
```

The server answers `204` and `Access-Control-Allow-Origin: http://localhost:5173` (its single allowed origin, never `*`), with the allowed methods and the requested headers. In the browser this request is visible in DevTools, Network tab, as an `OPTIONS` entry before the `POST`.
