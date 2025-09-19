<!-- import React, { useState } from 'react';
import { userService } from '../api/services/userService';
import { useApi } from '../hooks/useApi';
import { User, CreateUserData } from '../types/api';

const UserList: React.FC = () => {
  const { data: users, loading, error, refetch } = useApi(() => userService.getUsers());
  const [creating, setCreating] = useState(false);

  const handleCreateUser = async (userData: CreateUserData) => {
    setCreating(true);
    try {
      await userService.createUser(userData);
      await refetch(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to create user:', error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Users</h2>
      {users?.map(user => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
}; -->