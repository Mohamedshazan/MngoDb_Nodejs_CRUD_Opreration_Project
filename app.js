// Import required modules and set up Express
const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const exhbs = require('express-handlebars');
const dbo = require('./db'); // Import the database module
const ObjectID = dbo.ObjectID; // ObjectID from MongoDB for working with document IDs

// Configure Handlebars as the view engine
app.engine('hbs',exhbs.engine({layoutsDir:'views/',defaultLayout:"main",extname:"hbs"}))
app.set('view engine','hbs');
app.set('views','views');

// Middleware to parse form data
app.use(bodyparser.urlencoded({extended:true}));

// Define a route to handle the root URL ('/')
app.get('/', async (req, res) => {
    // Get a database connection
    let database = await dbo.getDatabase();

    // Access the 'books' collection in the database
    const collection = database.collection('books');

    // Find all documents in the 'books' collection
    const cursor = collection.find({})

    // Convert the cursor result to an array of books
    let books = await cursor.toArray();

    let message = '';

    let edit_id, edit_book;

    // Check if a book should be edited
    if (req.query.edit_id) {
        edit_id = req.query.edit_id;
        // Find the book to edit based on the provided ID
        edit_book = await collection.findOne({ _id: new ObjectID(edit_id) })
    }

    // Check if a book should be deleted
    if (req.query.delete_id) {
        // Delete the book based on the provided ID
        await collection.deleteOne({ _id: new ObjectID(req.query.delete_id) })
        return res.redirect('/?status=3'); // Redirect to the homepage with a delete status
    }

    // Set a message based on the query parameter 'status'
    switch (req.query.status) {
        case '1':
            message = 'Inserted Successfully!';
            break;
        case '2':
            message = 'Updated Successfully!';
            break;
        case '3':
            message = 'Deleted Successfully!';
            break;
        default:
            break;
    }

    // Render the 'main' view and pass data to it
    res.render('main', { message, books, edit_id, edit_book })
})

// Define a route to handle the form submission for adding a new book
app.post('/store_book', async (req, res) => {
    let database = await dbo.getDatabase();
    const collection = database.collection('books');

    // Create a book object based on form data
    let book = { title: req.body.title, author: req.body.author };

    // Insert the new book into the 'books' collection
    await collection.insertOne(book);

    return res.redirect('/?status=1'); // Redirect to the homepage with an insert status
})

// Define a route to handle the form submission for updating an existing book
app.post('/update_book/:edit_id', async (req, res) => {
    let database = await dbo.getDatabase();
    const collection = database.collection('books');

    // Create a book object based on form data
    let book = { title: req.body.title, author: req.body.author };

    // Get the ID of the book to update from the URL parameter
    let edit_id = req.params.edit_id;

    // Update the book with the provided ID
    await collection.updateOne({ _id: new ObjectID(edit_id) }, { $set: book });

    return res.redirect('/?status=2'); // Redirect to the homepage with an update status
})

// Start the Express server on port 8000
app.listen(8000, () => { console.log('Listening to 8000 port'); })
