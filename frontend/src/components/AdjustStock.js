import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import {
    Dialog, DialogActions, DialogContent, DialogTitle,
    Button, TextField, Typography
} from '@mui/material';

const AdjustStock = ({ book, onClose, onBookUpdated }) => {
    const [newQuantity, setNewQuantity] = useState(0);

    useEffect(() => {
        if (book) {
            setNewQuantity(book.quantity);
        }
    }, [book]);

    if (!book) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post(`/books/${book.id}/stock`, {
                new_quantity: parseInt(newQuantity),
            });
            alert('Stock updated successfully!');
            onBookUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating stock:', error);
            const errorMessage = error.response?.data?.details || 'Failed to update stock.';
            alert(errorMessage);
        }
    };

    return (
        <Dialog open={true} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle>Adjust Stock for "{book.title}"</DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Current Total: {book.quantity}, Available: {book.quantity_available}
                </Typography>
                <TextField
                    margin="dense"
                    required
                    fullWidth
                    label="New Total Quantity"
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value, 10) || 0)}
                    InputProps={{ inputProps: { min: 0 } }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="contained">Update Stock</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdjustStock;
