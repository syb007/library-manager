import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditModal.css';

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
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit Member</h2>
                <form onSubmit={handleSubmit}>
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
                    <div className="modal-actions">
                        <button type="submit">Save Changes</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditMember;
