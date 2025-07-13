import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Chip, Spinner } from '@heroui/react'; // FIXED: Removed unused Avatar
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  status: string;
  proposalCount: number;
  createdAt: any;
  budgetType: string;
  budgetMin: number;
  budgetMax: number;
}

export const ClientDashboard: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const { user, canPostJobs } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalProposals: 0,
    jobsInProgress: 0,
    completedJobs: 0
  });

  useEffect(() => {
    if (user) {
      fetchClientJobs();
      fetchClientStats();
    }
  }, [user]);

  const fetchClientJobs = async () => {
    if (!user) return;
    
    try {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('clientId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(jobsQuery);
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientStats = async () => {
    if (!user) return;
    
    try {
      // Fetch different job statuses
      const activeQuery = query(
        collection(db, 'jobs'),
        where('clientId', '==', user.uid),
        where('status', '==', 'open')
      );
      const activeSnapshot = await getDocs(activeQuery);
      
      const inProgressQuery = query(
        collection(db, 'jobs'),
        where('clientId', '==', user.uid),
        where('status', '==', 'in-progress')
      );
      const inProgressSnapshot = await getDocs(inProgressQuery);
      
      const completedQuery = query(
        collection(db, 'jobs'),
        where('clientId', '==', user.uid),
        where('status', '==', 'completed')
      );
      const completedSnapshot = await getDocs(completedQuery);
      
      // Calculate total proposals
      let totalProposals = 0;
      activeSnapshot.docs.forEach(doc => {
        totalProposals += doc.data().proposalCount || 0;
      });
      
      setStats({
        activeJobs: activeSnapshot.size,
        totalProposals,
        jobsInProgress: inProgressSnapshot.size,
        completedJobs: completedSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'in-progress': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const formatBudget = (job: Job) => {
    if (job.budgetType === 'fixed') {
      return `$${job.budgetMin}`;
    }
    return `$${job.budgetMin}-${job.budgetMax}/hr`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner color="secondary" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={isDarkMode ? 'glass-effect' : ''}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Jobs</p>
                <p className="text-2xl font-semibold">{stats.activeJobs}</p>
              </div>
              <Icon icon="lucide:briefcase" className="text-3xl text-blue-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card className={isDarkMode ? 'glass-effect' : ''}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Proposals</p>
                <p className="text-2xl font-semibold">{stats.totalProposals}</p>
              </div>
              <Icon icon="lucide:file-text" className="text-3xl text-green-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card className={isDarkMode ? 'glass-effect' : ''}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold">{stats.jobsInProgress}</p>
              </div>
              <Icon icon="lucide:clock" className="text-3xl text-yellow-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card className={isDarkMode ? 'glass-effect' : ''}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-semibold">{stats.completedJobs}</p>
              </div>
              <Icon icon="lucide:check-circle" className="text-3xl text-purple-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card className={isDarkMode ? 'glass-effect' : ''}>
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Jobs</h3>
            {canPostJobs && (
              <Button
                color="secondary"
                size="sm"
                startContent={<Icon icon="lucide:plus" />}
                onPress={() => navigate('/post-job')}
              >
                Post New Job
              </Button>
            )}
          </div>
          
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="lucide:briefcase" className="text-4xl text-gray-400 mb-2" />
              <p className="text-gray-500">No jobs posted yet</p>
              {canPostJobs && (
                <Button
                  color="secondary"
                  variant="flat"
                  className="mt-4"
                  onPress={() => navigate('/post-job')}
                >
                  Post Your First Job
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{job.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{formatBudget(job)}</span>
                        <span>•</span>
                        <span>{job.proposalCount} proposals</span>
                        <span>•</span>
                        <span>
                          {job.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </span>
                      </div>
                    </div>
                    <Chip
                      color={getStatusColor(job.status)}
                      size="sm"
                      variant="flat"
                    >
                      {job.status}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {jobs.length > 0 && (
            <div className="mt-4 text-center">
              <Button
                variant="light"
                onPress={() => navigate('/jobs/manage')}
              >
                View All Jobs
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          isPressable
          className={`${isDarkMode ? 'glass-effect' : ''} hover:scale-105 transition-transform`}
          onPress={() => navigate('/browse-freelancers')}
        >
          <CardBody className="text-center p-6">
            <Icon icon="lucide:users" className="text-4xl text-secondary mb-3" />
            <h4 className="font-semibold">Browse Freelancers</h4>
            <p className="text-sm text-gray-500 mt-1">Find talent for your projects</p>
          </CardBody>
        </Card>
        
        <Card 
          isPressable
          className={`${isDarkMode ? 'glass-effect' : ''} hover:scale-105 transition-transform`}
          onPress={() => navigate('/messages')}
        >
          <CardBody className="text-center p-6">
            <Icon icon="lucide:message-circle" className="text-4xl text-secondary mb-3" />
            <h4 className="font-semibold">Messages</h4>
            <p className="text-sm text-gray-500 mt-1">Chat with freelancers</p>
          </CardBody>
        </Card>
        
        <Card 
          isPressable
          className={`${isDarkMode ? 'glass-effect' : ''} hover:scale-105 transition-transform`}
          onPress={() => navigate('/billing')}
        >
          <CardBody className="text-center p-6">
            <Icon icon="lucide:credit-card" className="text-4xl text-secondary mb-3" />
            <h4 className="font-semibold">Billing & Payments</h4>
            <p className="text-sm text-gray-500 mt-1">Manage your transactions</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};