import React, { useState } from 'react';
import axios from 'axios';
import './AddBook.css';

const AddBook = () => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [publishedYear, setPublishedYear] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/books', {
                title,
                author,
                isbn,
                published_year: parseInt(publishedYear),
            });
            alert('Book added successfully!');
            setTitle('');
            setAuthor('');
            setIsbn('');
            setPublishedYear('');
        } catch (error) {
            console.error('Error adding book:', error);
            alert('Failed to add book.');
        }
    };

    return (
        <div className="add-book-container">
            <h2>Add a New Book</h2>
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
                <button type="submit">Add Book</button>
            </form>
        </div>
    );
};

export default AddBook;
