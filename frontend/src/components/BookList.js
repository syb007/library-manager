import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Tooltip, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
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
            setBooks(response.data.books || []);
        } catch (error) {
            console.error('Error fetching books:', error);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleEditClick = (book) => setEditingBook(book);
    const handleAdjustStockClick = (book) => setAdjustingStockBook(book);
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
        fetchBooks();
    };

    const handleDeleteBook = async (id) => {
        if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            try {
                await axios.delete(`http://localhost:3000/books/${id}`);
                alert('Book deleted successfully!');
                fetchBooks();
            } catch (error) {
                console.error('Error deleting book:', error);
                alert('Failed to delete book.');
            }
        }
    };

    return (
        <Paper sx={{ margin: 'auto', overflow: 'hidden' }}>
            <Typography sx={{ my: 2, mx: 2 }} color="text.secondary" variant="h5" component="h2">
                Book List
            </Typography>
            <TableContainer>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Author</TableCell>
                            <TableCell>ISBN</TableCell>
                            <TableCell align="right">Published</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Available</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {books.map((book) => (
                            <TableRow hover key={book.id}>
                                <TableCell>{book.id}</TableCell>
                                <TableCell>{book.title}</TableCell>
                                <TableCell>{book.author}</TableCell>
                                <TableCell>{book.isbn}</TableCell>
                                <TableCell align="right">{book.published_year}</TableCell>
                                <TableCell align="right">{book.quantity}</TableCell>
                                <TableCell align="right">{book.quantity_available}</TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Details">
                                        <IconButton onClick={() => handleDetailsClick(book.id)}><InfoIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                        <IconButton onClick={() => handleEditClick(book)}><EditIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Adjust Stock">
                                        <IconButton onClick={() => handleAdjustStockClick(book)}><AddShoppingCartIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton onClick={() => handleDeleteBook(book.id)}><DeleteIcon /></IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {editingBook && <EditBook book={editingBook} onClose={handleCloseModal} onBookUpdated={handleBookUpdated} />}
            {adjustingStockBook && <AdjustStock book={adjustingStockBook} onClose={handleCloseModal} onBookUpdated={handleBookUpdated} />}
            {detailsData && <DetailsModal title="Book Details" data={detailsData} onClose={handleCloseModal} />}
        </Paper>
    );
};

export default BookList;
