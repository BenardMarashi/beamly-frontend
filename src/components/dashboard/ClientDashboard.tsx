import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Chip, Avatar, Spinner } from '@heroui/react';
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
        <CardBody className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Your Jobs</h3>
            {canPostJobs && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={() => navigate('/post-job')}
                startContent={<Icon icon="lucide:plus" />}
              >
                Post New Job
              </Button>
            )}
          </div>
          
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="lucide:briefcase" className="text-4xl text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No jobs posted yet</p>
              <Button
                color="secondary"
                variant="flat"
                size="sm"
                className="mt-4"
                onPress={() => navigate('/post-job')}
              >
                Post Your First Job
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{job.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatBudget(job)}</span>
                        <span>{job.proposalCount} proposals</span>
                      </div>
                    </div>
                    <Chip
                      size="sm"
                      color={getStatusColor(job.status)}
                      variant="flat"
                    >
                      {job.status}
                    </Chip>
                  </div>
                </div>
              ))}
              
              <Button
                variant="light"
                color="primary"
                fullWidth
                onPress={() => navigate('/jobs/manage')}
              >
                View All Jobs
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};