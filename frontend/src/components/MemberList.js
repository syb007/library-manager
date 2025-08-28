import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MemberList.css';
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
            const response = await axios.get('http://localhost:3000/members');
            setMembers(response.data.members);
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
            await axios.post('http://localhost:3000/members', { name, email, phone });
            alert('Member added successfully!');
            setName('');
            setEmail('');
            setPhone('');
            fetchMembers(); // Refresh the list
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member.');
        }
    };

    const handleDeleteMember = async (id) => {
        try {
            await axios.delete(`http://localhost:3000/members/${id}`);
            alert('Member deleted successfully!');
            fetchMembers(); // Refresh the list
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Failed to delete member.');
        }
    };

    const handleEditClick = (member) => {
        setEditingMember(member);
    };

    const handleDetailsClick = async (memberId) => {
        try {
            const response = await axios.get(`http://localhost:3000/members/${memberId}/details`);
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
        fetchMembers(); // Refresh the list after an update
    };

    return (
        <div className="member-container">
            <div className="add-member-form">
                <h2>Add a New Member</h2>
                <form onSubmit={handleAddMember}>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <button type="submit">Add Member</button>
                </form>
            </div>

            <div className="member-list">
                <h2>Member List</h2>
                <button onClick={fetchMembers}>Refresh</button>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member) => (
                            <tr key={member.id}>
                                <td>{member.id}</td>
                                <td>{member.name}</td>
                                <td>{member.email}</td>
                                <td>{member.phone}</td>
                                <td>
                                    <button onClick={() => handleDetailsClick(member.id)}>Details</button>
                                    <button onClick={() => handleEditClick(member)}>Edit</button>
                                    <button onClick={() => handleDeleteMember(member.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingMember && (
                <EditMember
                    member={editingMember}
                    onClose={handleCloseModal}
                    onMemberUpdated={handleMemberUpdated}
                />
            )}

            {detailsData && (
                <DetailsModal
                    title="Member Details"
                    data={detailsData}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default MemberList;
