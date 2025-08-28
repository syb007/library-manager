import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditModal.css';

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
            await axios.post(`http://localhost:3000/books/${book.id}/stock`, {
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
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Adjust Stock for "{book.title}"</h2>
                <p>Current Total Quantity: {book.quantity}</p>
                <p>Currently Available: {book.quantity_available}</p>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="new_quantity">New Total Quantity:</label>
                    <input
                        id="new_quantity"
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        required
                        min="0"
                    />
                    <div className="modal-actions">
                        <button type="submit">Update Stock</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdjustStock;
