process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");
const Book = require("../models/book");


beforeEach(async function () {
  await db.query("DELETE FROM books");

  const ga = {
    isbn: "1843430851",
    amazon_url: "https://www.amazon.com/Gulag-Archipelago-Aleksandr-Solzhenitsyn/dp/1843430851/",
    author: "Aleksandr Solzhenitsyn",
    language: "english",
    pages: 496,
    publisher: "Vintage UK",
    title: "The Gulag Archipelago",
    year: 2002
  }

  const o = {
    isbn: "9780140268867",
    amazon_url: "https://www.amazon.com/Odyssey-Homer/dp/0140268863",
    author: "Homer",
    language: "english",
    pages: 541,
    publisher: "Penguin Classics",
    title: "The Odyssey",
    year: 1999
  }

  let b1 = await Book.create(ga);
  let b2 = await Book.create(o);
});

/** GET / => {books: [book, ...]}  */

describe("POST /auth/register", function () {
  test("gets full list of books", async function () {
    const response = await request(app).get("/books/");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      books: [
        {
          isbn: "1843430851",
          amazon_url: "https://www.amazon.com/Gulag-Archipelago-Aleksandr-Solzhenitsyn/dp/1843430851/",
          author: "Aleksandr Solzhenitsyn",
          language: "english",
          pages: 496,
          publisher: "Vintage UK",
          title: "The Gulag Archipelago",
          year: 2002
        },
        {
          isbn: "9780140268867",
          amazon_url: "https://www.amazon.com/Odyssey-Homer/dp/0140268863",
          author: "Homer",
          language: "english",
          pages: 541,
          publisher: "Penguin Classics",
          title: "The Odyssey",
          year: 1999
        }
      ]
    })
  });
});

/** GET /[id]  => {book: book} */

describe("GET /books/:isbn", function () {
  test("gets book by isbn", async function () {
    const response = await request(app).get("/books/1843430851");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      book: {
        isbn: "1843430851",
        amazon_url: "https://www.amazon.com/Gulag-Archipelago-Aleksandr-Solzhenitsyn/dp/1843430851/",
        author: "Aleksandr Solzhenitsyn",
        language: "english",
        pages: 496,
        publisher: "Vintage UK",
        title: "The Gulag Archipelago",
        year: 2002
      }
    });
  });

  test("responds with 404 if book not found", async function () {
    const response = await request(app).get("/books/999999999");
    expect(response.statusCode).toBe(404);
    expect(response.body.error.message).toBe("There is no book with an isbn '999999999'");
  });
});

/** POST /   bookData => {book: newBook}  */

describe("POST /books/", function () {
  test("creates new book and responds with book information", async function () {
    const p = {
      isbn: "0872203492",
      amazon_url: "https://www.amazon.com/Plato-Complete-Works/dp/0872203492/",
      author: "Plato",
      language: "english",
      pages: 1838,
      publisher: "Hackett Publishing Co.",
      title: "Plato: Complete Works",
      year: 1997
    }
    const response = await request(app).post("/books/").send(p);
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ book: p });
  });

  test("responds with error message if necessary data is missing or of incorrect type", async function () {
    const p = {
      isbn: parseInt("0872203492"), // isbn is int instead of string
      amazon_url: "https://www.amazon.com/Plato-Complete-Works/dp/0872203492/",
      author: "Plato",
      language: "english",
      pages: 1838,
      publisher: "Hackett Publishing Co.",
      title: "Plato: Complete Works",
      year: 1997
    }
    let response = await request(app).post("/books/").send(p);
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe('instance.isbn is not of a type(s) string');

    p.isbn = "0872203492";
    p.pages = "1838"; // pages is string instead of int
    response = await request(app).post("/books/").send(p);
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe('instance.pages is not of a type(s) integer');

    p.pages = 1838;
    p.year = "1997";  // year is string instead of int
    response = await request(app).post("/books/").send(p);
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe('instance.year is not of a type(s) integer');

    p.year = 1997;
    delete p.isbn;  // isbn missing
    response = await request(app).post("/books/").send(p);
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe('instance requires property "isbn"');

    p.isbn = "0872203492";
    delete p.author;  // author missing
    response = await request(app).post("/books/").send(p);
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe('instance requires property "author"');
  });
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

describe("PUT /books/:isbn", function () {
  test("updates a book by isbn", async function () {
    const o = {
      amazon_url: "https://www.amazon.com/Odyssey-Homer/dp/0140268863",
      author: "Homer, Robert Fagles",
      language: "english",
      pages: 543,
      publisher: "Penguin Classics",
      title: "The Odyssey",
      year: 2000
    }
    const response = await request(app).put("/books/9780140268867").send(o);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      book: {
        isbn: "9780140268867",
        amazon_url: "https://www.amazon.com/Odyssey-Homer/dp/0140268863",
        author: "Homer, Robert Fagles",
        language: "english",
        pages: 543,
        publisher: "Penguin Classics",
        title: "The Odyssey",
        year: 2000
      }
    });
  });

  test("responds with 404 if book not found", async function () {
    const o = {
      amazon_url: "https://www.amazon.com/Odyssey-Homer/dp/0140268863",
      author: "Homer, Robert Fagles",
      language: "english",
      pages: 543,
      publisher: "Penguin Classics",
      title: "The Odyssey",
      year: 2000
    }
    const response = await request(app).put("/books/999999999").send(o);
    expect(response.statusCode).toBe(404);
    expect(response.body.error.message).toBe("There is no book with an isbn '999999999'");
  });

  test("responds with error message if necessary data is missing or of incorrect type", async function () {
    const o = {
      amazon_url: "https://www.amazon.com/Odyssey-Homer/dp/0140268863",
      author: "Homer, Robert Fagles",
      language: "english",
      pages: "543", // pages is string instead of int
      publisher: "Penguin Classics",
      title: "The Odyssey",
      year: 2000
    }
    let response = await request(app).put("/books/9780140268867").send(o);
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe('instance.pages is not of a type(s) integer');

    o.pages = 543;
    o.year = "2000";  // year is string instead of int
    response = await request(app).put("/books/9780140268867").send(o);
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe('instance.year is not of a type(s) integer');

    o.year = 2000;
    delete o.author;  // author missing
    response = await request(app).put("/books/9780140268867").send(o);
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe('instance requires property "author"');

    o.author = "Homer";
    delete o.publisher; // publisher missing
    response = await request(app).put("/books/9780140268867").send(o);
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message[0]).toBe('instance requires property "publisher"');
  });
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

describe("DELETE /books/:isbn", function () {
  test("delete a book by isbn", async function () {
    const response = await request(app).delete("/books/9780140268867");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'Book deleted' });
  });

  test("responds with 404 if book not found", async function () {
    const response = await request(app).delete("/books/999999999");
    expect(response.statusCode).toBe(404);
    expect(response.body.error.message).toBe("There is no book with an isbn '999999999'");
  });
});

afterAll(async function () {
  await db.end();
});
