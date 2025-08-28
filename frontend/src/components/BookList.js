import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookList.css';
import EditBook from './EditBook';
import AdjustStock from './AdjustStock';
import DetailsModal from './DetailsModal';

const BookList = () => {
    const [books, setBooks] = useState([]);
    const [editingBook, setEditingBook] = useState(null);
    const [adjustingStockBook, setAdjustingStockBook] = useState(null);
    const [detailsData, setDetailsData] = useState(null);

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

    const handleAdjustStockClick = (book) => {
        setAdjustingStockBook(book);
    };

    const handleDetailsClick = async (bookId) => {
        try {
            const response = await axios.get(`http://localhost:3000/books/${bookId}/details`);
            setDetailsData(response.data);
        } catch (error) {
            console.error('Error fetching book details:', error);
            alert('Failed to fetch book details.');
        }
    };

    const handleCloseModal = () => {
        setEditingBook(null);
        setAdjustingStockBook(null);
        setDetailsData(null);
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
                                <button onClick={() => handleDetailsClick(book.id)}>Details</button>
                                <button onClick={() => handleEditClick(book)}>Edit</button>
                                <button onClick={() => handleAdjustStockClick(book)}>Adjust Stock</button>
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

            {adjustingStockBook && (
                <AdjustStock
                    book={adjustingStockBook}
                    onClose={handleCloseModal}
                    onBookUpdated={handleBookUpdated}
                />
            )}

            {detailsData && (
                <DetailsModal
                    title="Book Details"
                    data={detailsData}
                    onClose={handleCloseModal}
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
