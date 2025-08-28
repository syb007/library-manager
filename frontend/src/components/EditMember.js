import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Button, TextField
} from '@mui/material';

const EditMember = ({ member, onClose, onMemberUpdated }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (member) {
            setName(member.name);
            setEmail(member.email);
            setPhone(member.phone);
        }
    }, [member]);

    if (!member) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:3000/members/${member.id}`, {
                name,
                email,
                phone,
            });
            alert('Member updated successfully!');
            onMemberUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating member:', error);
            alert('Failed to update member.');
        }
    };

    return (
        <Dialog open={true} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Please edit the details of the member below.
                </DialogContentText>
                <TextField margin="dense" required fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <TextField margin="dense" required fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <TextField margin="dense" fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="contained">Save Changes</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditMember;
