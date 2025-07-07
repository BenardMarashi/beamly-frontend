import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ClientGuardProps {
  children: React.ReactNode;
}

export const ClientGuard: React.FC<ClientGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { loading, canPostJobs } = useAuth();
  
  useEffect(() => {
    if (!loading && !canPostJobs) {
      toast.error('This page is only accessible to clients');
      navigate('/dashboard');
    }
  }, [loading, canPostJobs, navigate]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return canPostJobs ? <>{children}</> : null;
};