import React, { useState } from 'react';
import axios from 'axios';
import './BorrowBook.css';

const BorrowBook = () => {
    const [borrowBookId, setBorrowBookId] = useState('');
    const [borrowMemberId, setBorrowMemberId] = useState('');
    const [returnBookId, setReturnBookId] = useState('');
    const [returnMemberId, setReturnMemberId] = useState('');

    const handleBorrow = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/borrow', {
                book_id: borrowBookId,
                member_id: borrowMemberId,
            });
            alert('Book borrowed successfully!');
            setBorrowBookId('');
            setBorrowMemberId('');
        } catch (error) {
            console.error('Error borrowing book:', error);
            alert('Failed to borrow book.');
        }
    };

    const handleReturn = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/return', {
                book_id: returnBookId,
                member_id: returnMemberId,
            });
            alert('Book returned successfully!');
            setReturnBookId('');
            setReturnMemberId('');
        } catch (error) {
            console.error('Error returning book:', error);
            alert('Failed to return book.');
        }
    };

    return (
        <div className="borrow-return-container">
            <div className="form-container">
                <h2>Borrow a Book</h2>
                <form onSubmit={handleBorrow}>
                    <input
                        type="text"
                        placeholder="Book ID"
                        value={borrowBookId}
                        onChange={(e) => setBorrowBookId(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Member ID"
                        value={borrowMemberId}
                        onChange={(e) => setBorrowMemberId(e.target.value)}
                        required
                    />
                    <button type="submit">Borrow Book</button>
                </form>
            </div>

            <div className="form-container">
                <h2>Return a Book</h2>
                <form onSubmit={handleReturn}>
                    <input
                        type="text"
                        placeholder="Book ID"
                        value={returnBookId}
                        onChange={(e) => setReturnBookId(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Member ID"
                        value={returnMemberId}
                        onChange={(e) => setReturnMemberId(e.target.value)}
                        required
                    />
                    <button type="submit">Return Book</button>
                </form>
            </div>
        </div>
    );
};

export default BorrowBook;
