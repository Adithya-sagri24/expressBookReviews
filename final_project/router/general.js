const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper function to check if user exists
const doesExist = (username) => {
  let userswithsamename = users.filter((user) => user.username === username);
  return userswithsamename.length > 0;
};

// ==========================================
// Task 6: Register a new user
// ==========================================
public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (doesExist(username)) {
    return res.status(404).json({ message: "Customer already exists!" });
  }

  users.push({ username: username, password: password });
  return res.status(200).json({ message: "Customer successfully registered. Now you can login" });
});

// ==========================================
// Promise-based Helper Functions
// ==========================================

// Resolves with all books
const getAllBooksPromise = () => {
  return new Promise((resolve, reject) => {
    if (books) {
      resolve(books);
    } else {
      reject({ status: 500, message: "Error retrieving books database" });
    }
  });
};

// Resolves with book by ISBN
const getBookByISBNPromise = (isbn) => {
  return new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject({ status: 404, message: `Book with ISBN ${isbn} not found` });
    }
  });
};

// Resolves with books by author
const getBooksByAuthorPromise = (author) => {
  return new Promise((resolve, reject) => {
    const matchedBooks = {};
    const keys = Object.keys(books);
    keys.forEach((key) => {
      if (books[key].author.toLowerCase() === author.toLowerCase()) {
        matchedBooks[key] = books[key];
      }
    });

    if (Object.keys(matchedBooks).length > 0) {
      resolve(matchedBooks);
    } else {
      reject({ status: 404, message: `No books found for author: ${author}` });
    }
  });
};

// Resolves with books by title
const getBooksByTitlePromise = (title) => {
  return new Promise((resolve, reject) => {
    const matchedBooks = {};
    const keys = Object.keys(books);
    keys.forEach((key) => {
      if (books[key].title.toLowerCase() === title.toLowerCase()) {
        matchedBooks[key] = books[key];
      }
    });

    if (Object.keys(matchedBooks).length > 0) {
      resolve(matchedBooks);
    } else {
      reject({ status: 404, message: `No books found with title: ${title}` });
    }
  });
};

// ==========================================
// Task 1 & Task 10: Get the book list available in the shop
// Using async/await with Promise
// ==========================================
public_users.get('/', async function (req, res) {
  try {
    const bookList = await getAllBooksPromise();
    return res.status(200).send(JSON.stringify(bookList, null, 4));
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// ==========================================
// Task 2 & Task 11: Get book details based on ISBN
// Using Promise callbacks (.then, .catch)
// ==========================================
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  getBookByISBNPromise(isbn)
    .then((book) => {
      return res.status(200).send(JSON.stringify(book, null, 4));
    })
    .catch((error) => {
      return res.status(error.status || 500).json({ message: error.message });
    });
});

// ==========================================
// Task 3 & Task 12: Get book details based on author
// Using async/await with Promise
// ==========================================
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;
  try {
    const authorBooks = await getBooksByAuthorPromise(author);
    return res.status(200).send(JSON.stringify(authorBooks, null, 4));
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// ==========================================
// Task 4 & Task 13: Get all books based on title
// Using Promise callbacks (.then, .catch)
// ==========================================
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;
  getBooksByTitlePromise(title)
    .then((titleBooks) => {
      return res.status(200).send(JSON.stringify(titleBooks, null, 4));
    })
    .catch((error) => {
      return res.status(error.status || 500).json({ message: error.message });
    });
});

// ==========================================
// Task 5: Get book review
// ==========================================
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
});

// ==========================================
// Tasks 10-13: Async / Promise implementations using Axios
// ==========================================

// Task 10: Get all books using async/await with Axios
const getAllBooksAxios = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all books via Axios:", error.message);
    throw error;
  }
};

// Task 11: Get book details by ISBN using Promise callbacks with Axios
const getBookByISBNAxios = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((error) => {
      console.error(`Error fetching ISBN ${isbn} via Axios:`, error.message);
      throw error;
    });
};

// Task 12: Get book details by author using async/await with Axios
const getBooksByAuthorAxios = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching author ${author} via Axios:`, error.message);
    throw error;
  }
};

// Task 13: Get book details by title using Promise callbacks with Axios
const getBooksByTitleAxios = (title) => {
  return axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => response.data)
    .catch((error) => {
      console.error(`Error fetching title ${title} via Axios:`, error.message);
      throw error;
    });
};

// Optional endpoints exposing Axios functions directly
public_users.get('/async/books', async function (req, res) {
  try {
    const data = await getAllBooksAxios();
    return res.status(200).send(JSON.stringify(data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

public_users.get('/async/isbn/:isbn', function (req, res) {
  getBookByISBNAxios(req.params.isbn)
    .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
    .catch((error) => res.status(500).json({ message: error.message }));
});

public_users.get('/async/author/:author', async function (req, res) {
  try {
    const data = await getBooksByAuthorAxios(req.params.author);
    return res.status(200).send(JSON.stringify(data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

public_users.get('/async/title/:title', function (req, res) {
  getBooksByTitleAxios(req.params.title)
    .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
    .catch((error) => res.status(500).json({ message: error.message }));
});

module.exports.general = public_users;
module.exports.getAllBooksAxios = getAllBooksAxios;
module.exports.getBookByISBNAxios = getBookByISBNAxios;
module.exports.getBooksByAuthorAxios = getBooksByAuthorAxios;
module.exports.getBooksByTitleAxios = getBooksByTitleAxios;
