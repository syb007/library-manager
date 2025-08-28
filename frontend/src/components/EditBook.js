import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import {
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Button, TextField
} from '@mui/material';

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
            await apiClient.put(`/books/${book.id}`, {
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
        <Dialog open={true} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Please edit the details of the book below.
                </DialogContentText>
                <TextField margin="dense" required fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <TextField margin="dense" required fullWidth label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                <TextField margin="dense" required fullWidth label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
                <TextField margin="dense" required fullWidth label="Published Year" type="number" value={publishedYear} onChange={(e) => setPublishedYear(e.target.value)} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="contained">Save Changes</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditBook;
