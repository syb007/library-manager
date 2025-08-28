import React, { useState } from 'react';
import axios from 'axios';
import { Paper, Box, Typography, TextField, Button } from '@mui/material';

const AddBook = () => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [publishedYear, setPublishedYear] = useState('');
    const [quantity, setQuantity] = useState(1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/books', {
                title,
                author,
                isbn,
                published_year: parseInt(publishedYear),
                quantity: parseInt(quantity),
            });
            alert('Book added successfully!');
            setTitle('');
            setAuthor('');
            setIsbn('');
            setPublishedYear('');
            setQuantity(1);
        } catch (error) {
            console.error('Error adding book:', error);
            alert('Failed to add book.');
        }
    };

    return (
        <Paper sx={{ p: 2, maxWidth: '600px', margin: 'auto' }}>
            <Typography variant="h6" component="h2" gutterBottom>
                Add a New Book
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                <TextField margin="normal" required fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <TextField margin="normal" required fullWidth label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                <TextField margin="normal" required fullWidth label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
                <TextField margin="normal" required fullWidth label="Published Year" type="number" value={publishedYear} onChange={(e) => setPublishedYear(e.target.value)} />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    InputProps={{ inputProps: { min: 1 } }}
                />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                    Add Book
                </Button>
            </Box>
        </Paper>
    );
};

export default AddBook;
