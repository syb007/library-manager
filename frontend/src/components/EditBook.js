import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditModal.css';

const EditBook = ({ book, onClose, onBookUpdated }) => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [publishedYear, setPublishedYear] = useState('');

    useEffect(() => {
        if (book) {
            setTitle(book.title);
            setAuthor(book.author);
            setIsbn(book.isbn);
            setPublishedYear(book.published_year);
        }
    }, [book]);

    if (!book) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:3000/books/${book.id}`, {
                title,
                author,
                isbn,
                published_year: parseInt(publishedYear),
            });
            alert('Book updated successfully!');
            onBookUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating book:', error);
            alert('Failed to update book.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit Book</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="ISBN"
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Published Year"
                        value={publishedYear}
                        onChange={(e) => setPublishedYear(e.target.value)}
                        required
                    />
                    <div className="modal-actions">
                        <button type="submit">Save Changes</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBook;
