import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Card, CardBody, Button, Chip, Spinner } from '@nextui-org/react';
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

interface StatsData {
  activeJobs: number;
  totalProposals: number;
  jobsInProgress: number;
  completedJobs: number;
}

// Memoized Stats Card Component
const StatCard = memo(({ 
  title, 
  value, 
  icon, 
  iconColor, 
  isDarkMode 
}: {
  title: string;
  value: number;
  icon: string;
  iconColor: string;
  isDarkMode: boolean;
}) => (
  <Card className={isDarkMode ? 'glass-effect' : ''}>
    <CardBody className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <Icon icon={icon} className={`text-3xl ${iconColor}`} />
      </div>
    </CardBody>
  </Card>
));

// Memoized Job Item Component
const JobItem = memo(({ 
  job, 
  onClick, 
  formatBudget, 
  getStatusColor 
}: {
  job: Job;
  onClick: (id: string) => void;
  formatBudget: (job: Job) => string;
  getStatusColor: (status: string) => any;
}) => (
  <div
    className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
    onClick={() => onClick(job.id)}
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
));

// Memoized Quick Action Card Component
const QuickActionCard = memo(({ 
  icon, 
  iconColor, 
  title, 
  description, 
  onClick, 
  isDarkMode 
}: {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  onClick: () => void;
  isDarkMode: boolean;
}) => (
  <Card 
    isPressable
    className={`${isDarkMode ? 'glass-effect' : ''} hover:scale-105 transition-transform`}
    onPress={onClick}
  >
    <CardBody className="text-center p-6">
      <Icon icon={icon} className={`text-4xl ${iconColor} mb-3`} />
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </CardBody>
  </Card>
));

// Memoized Stats Grid Component
const StatsGrid = memo(({ stats, isDarkMode }: { stats: StatsData; isDarkMode: boolean }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <StatCard
      title="Active Jobs"
      value={stats.activeJobs}
      icon="lucide:briefcase"
      iconColor="text-blue-500"
      isDarkMode={isDarkMode}
    />
    <StatCard
      title="Total Proposals"
      value={stats.totalProposals}
      icon="lucide:file-text"
      iconColor="text-green-500"
      isDarkMode={isDarkMode}
    />
    <StatCard
      title="In Progress"
      value={stats.jobsInProgress}
      icon="lucide:clock"
      iconColor="text-yellow-500"
      isDarkMode={isDarkMode}
    />
    <StatCard
      title="Completed"
      value={stats.completedJobs}
      icon="lucide:check-circle"
      iconColor="text-purple-500"
      isDarkMode={isDarkMode}
    />
  </div>
));

// Memoized Recent Jobs Section
const RecentJobsSection = memo(({ 
  jobs, 
  canPostJobs, 
  isDarkMode, 
  onNavigate,
  formatBudget,
  getStatusColor
}: {
  jobs: Job[];
  canPostJobs: boolean;
  isDarkMode: boolean;
  onNavigate: (path: string) => void;
  formatBudget: (job: Job) => string;
  getStatusColor: (status: string) => any;
}) => {
  const handleJobClick = useCallback((jobId: string) => {
    onNavigate(`/job/${jobId}`);
  }, [onNavigate]);

  return (
    <Card className={isDarkMode ? 'glass-effect' : ''}>
      <CardBody>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Jobs</h3>
          {canPostJobs && (
            <Button
              color="secondary"
              size="sm"
              startContent={<Icon icon="lucide:plus" />}
              onPress={() => onNavigate('/post-job')}
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
                onPress={() => onNavigate('/post-job')}
              >
                Post Your First Job
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobItem
                key={job.id}
                job={job}
                onClick={handleJobClick}
                formatBudget={formatBudget}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}
        
        {jobs.length > 0 && (
          <div className="mt-4 text-center">
            <Button
              variant="light"
              onPress={() => onNavigate('/job/manage')}
            >
              View All Jobs
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
});

// Main Component
export const ClientDashboard: React.FC<{ isDarkMode: boolean }> = memo(({ isDarkMode }) => {
  const navigate = useNavigate();
  const { user, canPostJobs } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    activeJobs: 0,
    totalProposals: 0,
    jobsInProgress: 0,
    completedJobs: 0
  });

  // Memoize navigation handler
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Memoize helper functions
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'in-progress': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  }, []);

  const formatBudget = useCallback((job: Job) => {
    if (job.budgetType === 'fixed') {
      return `$${job.budgetMin}`;
    }
    return `$${job.budgetMin}-${job.budgetMax}/hr`;
  }, []);

  // Fetch client jobs
  const fetchClientJobs = useCallback(async () => {
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
  }, [user]);

  // Fetch client stats
  const fetchClientStats = useCallback(async () => {
    if (!user) return;
    
    try {
      // Use Promise.all for parallel fetching
      const [activeSnapshot, inProgressSnapshot, completedSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid),
          where('status', '==', 'open')
        )),
        getDocs(query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid),
          where('status', '==', 'in-progress')
        )),
        getDocs(query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid),
          where('status', '==', 'completed')
        ))
      ]);
      
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
  }, [user]);

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      // Fetch in parallel
      Promise.all([
        fetchClientJobs(),
        fetchClientStats()
      ]);
    }
  }, [user, fetchClientJobs, fetchClientStats]);

  // Memoize quick actions data
  const quickActions = useMemo(() => [
    {
      icon: 'lucide:users',
      iconColor: 'text-secondary',
      title: 'Browse Freelancers',
      description: 'Find talent for your projects',
      path: '/browse-freelancers'
    },
    {
      icon: 'solar:document-text-bold',
      iconColor: 'text-warning',
      title: 'View Proposals',
      description: 'Review applications',
      path: '/client/proposals'
    },
    {
      icon: 'lucide:message-circle',
      iconColor: 'text-secondary',
      title: 'Messages',
      description: 'Chat with freelancers',
      path: '/messages'
    },
    {
      icon: 'lucide:credit-card',
      iconColor: 'text-secondary',
      title: 'Billing & Payments',
      description: 'Manage your transactions',
      path: '/billing'
    }
  ], []);

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
      <StatsGrid stats={stats} isDarkMode={isDarkMode} />

      {/* Recent Jobs */}
      <RecentJobsSection
        jobs={jobs}
        canPostJobs={canPostJobs}
        isDarkMode={isDarkMode}
        onNavigate={handleNavigate}
        formatBudget={formatBudget}
        getStatusColor={getStatusColor}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <QuickActionCard
            key={action.path}
            icon={action.icon}
            iconColor={action.iconColor}
            title={action.title}
            description={action.description}
            onClick={() => handleNavigate(action.path)}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  );
});