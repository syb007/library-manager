import React, { useState } from 'react';
import apiClient from '../api';
import { Paper, Box, Typography, TextField, Button, Grid } from '@mui/material';

const BorrowBook = () => {
    const [borrowBookId, setBorrowBookId] = useState('');
    const [borrowMemberId, setBorrowMemberId] = useState('');
    const [returnBookId, setReturnBookId] = useState('');
    const [returnMemberId, setReturnMemberId] = useState('');

    const handleBorrow = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/borrow', {
                book_id: borrowBookId,
                member_id: borrowMemberId,
            });
            alert('Book borrowed successfully!');
            setBorrowBookId('');
            setBorrowMemberId('');
        } catch (error) {
            console.error('Error borrowing book:', error);
            const errorMessage = error.response?.data?.details || 'Failed to borrow book.';
            alert(errorMessage);
        }
    };

    const handleReturn = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/return', {
                book_id: returnBookId,
                member_id: returnMemberId,
            });
            alert('Book returned successfully!');
            setReturnBookId('');
            setReturnMemberId('');
        } catch (error) {
            console.error('Error returning book:', error);
            const errorMessage = error.response?.data?.details || 'Failed to return book.';
            alert(errorMessage);
        }
    };

    return (
        <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={5}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Borrow a Book
                    </Typography>
                    <Box component="form" onSubmit={handleBorrow} noValidate sx={{ mt: 1 }}>
                        <TextField margin="normal" required fullWidth label="Book ID" value={borrowBookId} onChange={(e) => setBorrowBookId(e.target.value)} />
                        <TextField margin="normal" required fullWidth label="Member ID" value={borrowMemberId} onChange={(e) => setBorrowMemberId(e.target.value)} />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                            Borrow Book
                        </Button>
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Return a Book
                    </Typography>
                    <Box component="form" onSubmit={handleReturn} noValidate sx={{ mt: 1 }}>
                        <TextField margin="normal" required fullWidth label="Book ID" value={returnBookId} onChange={(e) => setReturnBookId(e.target.value)} />
                        <TextField margin="normal" required fullWidth label="Member ID" value={returnMemberId} onChange={(e) => setReturnMemberId(e.target.value)} />
                        <Button type="submit" fullWidth variant="contained" color="secondary" sx={{ mt: 3, mb: 2 }}>
                            Return Book
                        </Button>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default BorrowBook;
