import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface FreelancerGuardProps {
  children: React.ReactNode;
}

export const FreelancerGuard: React.FC<FreelancerGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { loading, canApplyToJobs } = useAuth();
  
  useEffect(() => {
    if (!loading && !canApplyToJobs) {
      toast.error('This page is only accessible to freelancers');
      navigate('/dashboard');
    }
  }, [loading, canApplyToJobs, navigate]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return canApplyToJobs ? <>{children}</> : null;
};