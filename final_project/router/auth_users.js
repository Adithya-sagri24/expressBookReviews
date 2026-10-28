const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
    // Check if the username already exists
    let usersWithSameName = users.filter((user) => {
        return user.username === username;
    });
    return usersWithSameName.length === 0;
};

const authenticatedUser = (username, password) => {
    // Check if username and password match records
    let validUsers = users.filter((user) => {
        return user.username === username && user.password === password;
    });
    return validUsers.length > 0;
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in: Username and password are required" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({
            username: username,
            data: username
        }, 'access', { expiresIn: 60 * 60 });

        req.session.authorization = {
            accessToken,
            username
        };

        return res.status(200).json({ message: "Customer successfully logged in" });
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    let review = req.query.review;
    if (!review && req.body && req.body.review) {
        review = req.body.review;
    }

    const username = (req.session && req.session.authorization && req.session.authorization.username) ||
                     (req.user && req.user.username) ||
                     (req.user && req.user.data);

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }

    if (!review) {
        return res.status(400).json({ message: "Review is required as a query parameter or request body" });
    }

    books[isbn].reviews[username] = review;

    return res.status(200).json({
        message: `The review for the book with ISBN ${isbn} has been added/updated.`,
        reviews: books[isbn].reviews
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = (req.session && req.session.authorization && req.session.authorization.username) ||
                     (req.user && req.user.username) ||
                     (req.user && req.user.data);

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }

    if (books[isbn].reviews && books[isbn].reviews[username]) {
        delete books[isbn].reviews[username];
        return res.status(200).json({
            message: `Reviews for the ISBN ${isbn} posted by the user ${username} deleted.`
        });
    } else {
        return res.status(404).json({
            message: `No review by user ${username} found for book with ISBN ${isbn}`
        });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
