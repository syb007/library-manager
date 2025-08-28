import React from 'react';
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography,
    List, ListItem, ListItemText, Divider
} from '@mui/material';

const DetailsModal = ({ title, data, onClose }) => {
    if (!data) {
        return null;
    }

    const formatTimestamp = (ts) => {
        if (!ts) return 'N/A';
        const date = new Date(ts.seconds * 1000 + ts.nanos / 1000000);
        return date.toLocaleDateString();
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>
                {data.book && (
                    <>
                        <Typography variant="h6" gutterBottom>Book Details</Typography>
                        <Typography><strong>Title:</strong> {data.book.title}</Typography>
                        <Typography><strong>Author:</strong> {data.book.author}</Typography>
                        <Typography><strong>Total Copies:</strong> {data.book.quantity}</Typography>
                        <Typography><strong>Available:</strong> {data.book.quantity_available}</Typography>
                        <Divider sx={{ my: 2 }} />
                    </>
                )}
                {data.member && (
                     <>
                        <Typography variant="h6" gutterBottom>Member Details</Typography>
                        <Typography><strong>Name:</strong> {data.member.name}</Typography>
                        <Typography><strong>Email:</strong> {data.member.email}</Typography>
                        <Typography><strong>Phone:</strong> {data.member.phone}</Typography>
                        <Divider sx={{ my: 2 }} />
                    </>
                )}

                <Typography variant="h6" gutterBottom>Active Borrowings</Typography>
                {data.active_borrowings && data.active_borrowings.length > 0 ? (
                    <List dense>
                        {data.active_borrowings.map(b => (
                            <ListItem key={b.borrowing_id}>
                                <ListItemText
                                    primary={b.book_title ? `Book: ${b.book_title}` : `Member: ${b.member_name}`}
                                    secondary={`Borrowed: ${formatTimestamp(b.borrow_date)}, Due: ${formatTimestamp(b.due_date)}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography>No active borrowings.</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DetailsModal;
