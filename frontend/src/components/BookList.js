import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookList.css';
import EditBook from './EditBook';

const BookList = () => {
    const [books, setBooks] = useState([]);
    const [editingBook, setEditingBook] = useState(null);

    const fetchBooks = async () => {
        try {
            const response = await axios.get('http://localhost:3000/books');
            setBooks(response.data.books);
        } catch (error) {
            console.error('Error fetching books:', error);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleEditClick = (book) => {
        setEditingBook(book);
    };

    const handleCloseModal = () => {
        setEditingBook(null);
    };

    const handleBookUpdated = () => {
        fetchBooks(); // Refresh the list after an update
    };

    return (
        <div className="book-list-container">
            <h2>Book List</h2>
            <button onClick={fetchBooks}>Refresh</button>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>ISBN</th>
                        <th>Published Year</th>
                        <th>Total Copies</th>
                        <th>Available</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {books.map((book) => (
                        <tr key={book.id}>
                            <td>{book.id}</td>
                            <td>{book.title}</td>
                            <td>{book.author}</td>
                            <td>{book.isbn}</td>
                            <td>{book.published_year}</td>
                            <td>{book.quantity}</td>
                            <td>{book.quantity_available}</td>
                            <td>
                                <button onClick={() => handleEditClick(book)}>Edit</button>
                                <button onClick={() => handleDeleteBook(book.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingBook && (
                <EditBook
                    book={editingBook}
                    onClose={handleCloseModal}
                    onBookUpdated={handleBookUpdated}
                />
            )}
        </div>
    );

    async function handleDeleteBook(id) {
        if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            try {
                await axios.delete(`http://localhost:3000/books/${id}`);
                alert('Book deleted successfully!');
                fetchBooks(); // Refresh the list
            } catch (error) {
                console.error('Error deleting book:', error);
                alert('Failed to delete book.');
            }
        }
    }
};

export default BookList;
