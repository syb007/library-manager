import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Tooltip, Typography, Grid, Box, TextField, Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import EditMember from './EditMember';
import DetailsModal from './DetailsModal';

const MemberList = () => {
    const [members, setMembers] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [editingMember, setEditingMember] = useState(null);
    const [detailsData, setDetailsData] = useState(null);

    const fetchMembers = async () => {
        try {
            const response = await apiClient.get('/members');
            setMembers(response.data.members || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/members', { name, email, phone });
            alert('Member added successfully!');
            setName('');
            setEmail('');
            setPhone('');
            fetchMembers();
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member.');
        }
    };

    const handleDeleteMember = async (id) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            try {
                await apiClient.delete(`/members/${id}`);
                alert('Member deleted successfully!');
                fetchMembers();
            } catch (error) {
                console.error('Error deleting member:', error);
                alert('Failed to delete member.');
            }
        }
    };

    const handleEditClick = (member) => setEditingMember(member);
    const handleDetailsClick = async (memberId) => {
        try {
            const response = await apiClient.get(`/members/${memberId}/details`);
            setDetailsData(response.data);
        } catch (error) {
            console.error('Error fetching member details:', error);
            alert('Failed to fetch member details.');
        }
    };

    const handleCloseModal = () => {
        setEditingMember(null);
        setDetailsData(null);
    };

    const handleMemberUpdated = () => {
        fetchMembers();
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Add a New Member
                    </Typography>
                    <Box component="form" onSubmit={handleAddMember} noValidate sx={{ mt: 1 }}>
                        <TextField margin="normal" required fullWidth id="name" label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} />
                        <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <TextField margin="normal" fullWidth id="phone" label="Phone Number" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                            Add Member
                        </Button>
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <Typography sx={{ my: 2, mx: 2 }} color="text.secondary" variant="h5" component="h2">
                        Member List
                    </Typography>
                    <TableContainer>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow hover key={member.id}>
                                        <TableCell>{member.id}</TableCell>
                                        <TableCell>{member.name}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>{member.phone}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Details">
                                                <IconButton onClick={() => handleDetailsClick(member.id)}><InfoIcon /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleEditClick(member)}><EditIcon /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton onClick={() => handleDeleteMember(member.id)}><DeleteIcon /></IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>

            {editingMember && <EditMember member={editingMember} onClose={handleCloseModal} onMemberUpdated={handleMemberUpdated} />}
            {detailsData && <DetailsModal title="Member Details" data={detailsData} onClose={handleCloseModal} />}
        </Grid>
    );
};

export default MemberList;
