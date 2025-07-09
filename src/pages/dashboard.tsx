import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Progress, Chip } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

interface RecentJob {
  id: string;
  title: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: string;
  createdAt: any;
}

interface RecentProposal {
  id: string;
  jobTitle: string;
  proposedRate: number;
  status: string;
  createdAt: any;
}

interface DashboardStats {
  activeJobs: number;
  totalEarnings: number;
  pendingProposals: number;
  completionRate: number;
  totalProposals: number;
  acceptedProposals: number;
}

const DashboardPage: React.FC = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalEarnings: 0,
    pendingProposals: 0,
    completionRate: 0,
    totalProposals: 0,
    acceptedProposals: 0
  });

  // Note: activeTab and setActiveTab are kept for future tab implementation
  // Currently not used but may be needed for dashboard sections
  // const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    if (user && userData) {
      fetchDashboardData();
    }
  }, [user, userData]);
  
  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const isFreelancer = userData?.userType === 'freelancer' || userData?.userType === 'both';
      const isClient = userData?.userType === 'client' || userData?.userType === 'both';
      
      if (isFreelancer) {
        await fetchFreelancerData();
      }
      
      if (isClient) {
        await fetchClientData();
      }
      
      // Calculate completion rate
      const completedProjects = userData?.completedProjects || 0;
      const totalProjects = completedProjects + stats.activeJobs;
      const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
      
      setStats(prev => ({
        ...prev,
        completionRate,
        totalEarnings: userData?.totalEarnings || 0
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFreelancerData = async () => {
    if (!user) return;
    
    // Fetch recent proposals
    const proposalsQuery = query(
      collection(db, 'proposals'),
      where('freelancerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const proposalsSnapshot = await getDocs(proposalsQuery);
    const proposals: RecentProposal[] = [];
    let totalProposals = 0;
    let acceptedProposals = 0;
    
    proposalsSnapshot.forEach((doc) => {
      const data = doc.data();
      proposals.push({
        id: doc.id,
        jobTitle: data.jobTitle,
        proposedRate: data.proposedRate,
        status: data.status,
        createdAt: data.createdAt
      });
      
      totalProposals++;
      if (data.status === 'accepted') {
        acceptedProposals++;
      }
    });
    
    setRecentProposals(proposals);
    setStats(prev => ({ ...prev, totalProposals, acceptedProposals }));
  };
  
  const fetchClientData = async () => {
    if (!user) return;
    
    // Fetch recent jobs
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobs: RecentJob[] = [];
    let activeJobs = 0;
    
    jobsSnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        title: data.title,
        status: data.status,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        budgetType: data.budgetType,
        createdAt: data.createdAt
      });
      
      if (data.status === 'open' || data.status === 'in-progress') {
        activeJobs++;
      }
    });
    
    setRecentJobs(jobs);
    setStats(prev => ({ ...prev, activeJobs }));
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'pending':
        return 'warning';
      case 'in-progress':
      case 'accepted':
        return 'success';
      case 'completed':
        return 'secondary';
      case 'cancelled':
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };
  
  const formatBudget = (job: RecentJob) => {
    if (job.budgetType === 'fixed') {
      return `$${job.budgetMin}`;
    }
    return `$${job.budgetMin} - $${job.budgetMax}/hr`;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {userData?.displayName || 'User'}!
            </h1>
            <p className="text-gray-400 mt-1">
              Here's what's happening with your account today.
            </p>
          </div>
          <Button
            color="secondary"
            className="text-beamly-third"
            onPress={() => navigate('/post-job')}
            startContent={<Icon icon="lucide:plus" />}
          >
            Post New Job
          </Button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:briefcase" className="text-blue-400" width={32} />
                <Chip color="primary" size="sm" variant="flat">
                  {userData?.userType === 'client' ? 'Posted' : 'Active'}
                </Chip>
              </div>
              <h3 className="text-gray-400 text-sm">Active Jobs</h3>
              <p className="text-2xl font-bold text-white">{stats.activeJobs}</p>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:dollar-sign" className="text-green-400" width={32} />
                <Chip color="success" size="sm" variant="flat">+12.5%</Chip>
              </div>
              <h3 className="text-gray-400 text-sm">Total Earnings</h3>
              <p className="text-2xl font-bold text-white">${stats.totalEarnings.toLocaleString()}</p>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:clock" className="text-yellow-400" width={32} />
                <Chip color="warning" size="sm" variant="flat">Pending</Chip>
              </div>
              <h3 className="text-gray-400 text-sm">Pending Proposals</h3>
              <p className="text-2xl font-bold text-white">{stats.pendingProposals}</p>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:trending-up" className="text-purple-400" width={32} />
                <Chip color="secondary" size="sm" variant="flat">Rate</Chip>
              </div>
              <h3 className="text-gray-400 text-sm">Completion Rate</h3>
              <p className="text-2xl font-bold text-white">{stats.completionRate.toFixed(0)}%</p>
            </CardBody>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Jobs/Proposals */}
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {userData?.userType === 'client' ? 'Recent Jobs' : 'Recent Proposals'}
                </h3>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => navigate(userData?.userType === 'client' ? '/jobs/manage' : '/proposals')}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {userData?.userType === 'client' ? (
                  recentJobs.map((job) => (
                    <div key={job.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{job.title}</p>
                        <p className="text-gray-400 text-sm">{formatBudget(job)}</p>
                      </div>
                      <Chip color={getStatusColor(job.status)} size="sm" variant="flat">
                        {job.status}
                      </Chip>
                    </div>
                  ))
                ) : (
                  recentProposals.map((proposal) => (
                    <div key={proposal.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{proposal.jobTitle}</p>
                        <p className="text-gray-400 text-sm">${proposal.proposedRate}/hr</p>
                      </div>
                      <Chip color={getStatusColor(proposal.status)} size="sm" variant="flat">
                        {proposal.status}
                      </Chip>
                    </div>
                  ))
                )}
                {(recentJobs.length === 0 && recentProposals.length === 0) && (
                  <p className="text-gray-400 text-center py-8">No recent activity</p>
                )}
              </div>
            </CardBody>
          </Card>
          
          {/* Quick Actions */}
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {userData?.userType === 'freelancer' && (
                  <>
                    <Button
                      variant="flat"
                      color="primary"
                      startContent={<Icon icon="lucide:search" />}
                      onClick={() => navigate('/looking-for-work')}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <span>Find Work</span>
                    </Button>
                    <Button
                      variant="flat"
                      color="success"
                      startContent={<Icon icon="lucide:edit" />}
                      onClick={() => navigate('/profile/edit')}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <span>Edit Profile</span>
                    </Button>
                  </>
                )}
                
                {userData?.userType === 'client' && (
                  <>
                    <Button
                      variant="flat"
                      color="primary"
                      startContent={<Icon icon="lucide:plus" />}
                      onClick={() => navigate('/post-job')}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <span>Post Job</span>
                    </Button>
                    <Button
                      variant="flat"
                      color="secondary"
                      startContent={<Icon icon="lucide:users" />}
                      onClick={() => navigate('/browse-freelancers')}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <span>Find Talent</span>
                    </Button>
                  </>
                )}
                
                {userData?.userType === 'both' && (
                  <>
                    <Button
                      variant="flat"
                      color="primary"
                      startContent={<Icon icon="lucide:search" />}
                      onClick={() => navigate('/looking-for-work')}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <span>Find Work</span>
                    </Button>
                    <Button
                      variant="flat"
                      color="secondary"
                      startContent={<Icon icon="lucide:plus" />}
                      onClick={() => navigate('/post-job')}
                      className="h-auto py-4 flex-col gap-2"
                    >
                      <span>Post Job</span>
                    </Button>
                  </>
                )}
                
                <Button
                  variant="flat"
                  color="success"
                  startContent={<Icon icon="lucide:message-square" />}
                  onClick={() => navigate('/chat')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <span>Messages</span>
                </Button>
                
                <Button
                  variant="flat"
                  color="primary"
                  startContent={<Icon icon="lucide:file-signature" />}
                  onClick={() => navigate('/contracts')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <span>Contracts</span>
                </Button>
                
                <Button
                  variant="flat"
                  color="secondary"
                  startContent={<Icon icon="lucide:bar-chart" />}
                  onClick={() => navigate('/analytics')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <span>Analytics</span>
                </Button>
                
                <Button
                  variant="flat"
                  color="warning"
                  startContent={<Icon icon="lucide:user" />}
                  onClick={() => navigate('/profile/edit')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <span>Edit Profile</span>
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Profile Completion */}
        {userData && (!userData.profileCompleted || !userData.bio || !userData.skills?.length) && (
          <Card className="yellow-glass">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Complete Your Profile</h3>
              <Progress 
                value={userData.bio ? 50 : 25} 
                color="warning" 
                className="mb-4"
              />
              <p className="text-gray-300 mb-4">
                A complete profile helps you stand out and attract more opportunities.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <Icon 
                    icon={userData?.displayName ? "lucide:check-circle" : "lucide:circle"} 
                    className={userData?.displayName ? "text-green-400" : "text-gray-400"}
                  />
                  <span className="text-gray-300">Add display name</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon 
                    icon={userData?.bio ? "lucide:check-circle" : "lucide:circle"} 
                    className={userData?.bio ? "text-green-400" : "text-gray-400"}
                  />
                  <span className="text-gray-300">Write a bio</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon 
                    icon={userData?.skills && userData.skills.length > 0 ? "lucide:check-circle" : "lucide:circle"} 
                    className={userData?.skills && userData.skills.length > 0 ? "text-green-400" : "text-gray-400"}
                  />
                  <span className="text-gray-300">Add skills</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon 
                    icon={userData?.hourlyRate && userData.hourlyRate > 0 ? "lucide:check-circle" : "lucide:circle"} 
                    className={userData?.hourlyRate && userData.hourlyRate > 0 ? "text-green-400" : "text-gray-400"}
                  />
                  <span className="text-gray-300">Set hourly rate</span>
                </li>
              </ul>
              <Button
                color="primary"
                fullWidth
                onClick={() => navigate('/create-profile')}
              >
                Complete Profile
              </Button>
            </CardBody>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardPage;