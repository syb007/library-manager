import React from 'react';
import './EditModal.css'; // Reusing the modal styles

const DetailsModal = ({ title, data, onClose }) => {
    if (!data) {
        return null;
    }

    // Helper to format timestamp from proto
    const formatTimestamp = (ts) => {
        if (!ts) return 'N/A';
        const date = new Date(ts.seconds * 1000 + ts.nanos / 1000000);
        return date.toLocaleDateString();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                {data.book && (
                    <div>
                        <h3>Book Details</h3>
                        <p><strong>Title:</strong> {data.book.title}</p>
                        <p><strong>Author:</strong> {data.book.author}</p>
                        <p><strong>Total Copies:</strong> {data.book.quantity}</p>
                        <p><strong>Available:</strong> {data.book.quantity_available}</p>
                    </div>
                )}
                {data.member && (
                     <div>
                        <h3>Member Details</h3>
                        <p><strong>Name:</strong> {data.member.name}</p>
                        <p><strong>Email:</strong> {data.member.email}</p>
                        <p><strong>Phone:</strong> {data.member.phone}</p>
                    </div>
                )}

                {data.active_borrowings && data.active_borrowings.length > 0 && (
                    <div>
                        <h4>Active Borrowings</h4>
                        <ul>
                            {data.active_borrowings.map(b => (
                                <li key={b.borrowing_id}>
                                    {b.book_title && `Book: ${b.book_title} (ID: ${b.book_id})`}
                                    {b.member_name && `Member: ${b.member_name} (ID: ${b.member_id})`}
                                    <br />
                                    Borrowed on: {formatTimestamp(b.borrow_date)},
                                    Due by: {formatTimestamp(b.due_date)}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                 {data.active_borrowings && data.active_borrowings.length === 0 && (
                    <p>No active borrowings.</p>
                 )}

                <div className="modal-actions">
                    <button type="button" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default DetailsModal;
