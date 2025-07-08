import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Button, Progress, Avatar, Chip, Tabs, Tab } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalProposals: number;
  acceptedProposals: number;
  totalEarnings: number;
  totalSpent: number;
  completedProjects: number;
  rating: number;
}

interface RecentJob {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: string;
  status: string;
  proposalCount: number;
  createdAt: any;
}

interface RecentProposal {
  id: string;
  jobTitle: string;
  proposedRate: number;
  status: string;
  createdAt: any;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, isFreelancer, isClient } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalProposals: 0,
    acceptedProposals: 0,
    totalEarnings: 0,
    totalSpent: 0,
    completedProjects: 0,
    rating: 0
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchDashboardData();
    }
  }, [user, navigate]);
  
  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch stats based on user type
      if (isClient) {
        await fetchClientData();
      }
      if (isFreelancer) {
        await fetchFreelancerData();
      }
      
      // Update stats from userData
      setStats(prev => ({
        ...prev,
        totalEarnings: userData?.totalEarnings || 0,
        totalSpent: userData?.totalSpent || 0,
        completedProjects: userData?.completedProjects || 0,
        rating: userData?.rating || 0
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
    let totalJobs = 0;
    let activeJobs = 0;
    
    jobsSnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        title: data.title,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        budgetType: data.budgetType,
        status: data.status,
        proposalCount: data.proposalCount || 0,
        createdAt: data.createdAt
      });
      
      totalJobs++;
      if (data.status === 'open' || data.status === 'in-progress') {
        activeJobs++;
      }
    });
    
    setRecentJobs(jobs);
    setStats(prev => ({ ...prev, totalJobs, activeJobs }));
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
            <p className="text-gray-400">Here's what's happening with your account today.</p>
          </div>
          <div className="flex gap-3">
            {isFreelancer && !userData?.profileCompleted && (
              <Button
                color="warning"
                variant="flat"
                startContent={<Icon icon="lucide:alert-circle" />}
                onClick={() => navigate('/create-profile')}
              >
                Complete Profile
              </Button>
            )}
            {isClient && (
              <Button
                color="primary"
                startContent={<Icon icon="lucide:plus" />}
                onClick={() => navigate('/post-job')}
              >
                Post a Job
              </Button>
            )}
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isClient && (
            <>
              <Card className="glass-effect border-none">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon icon="lucide:briefcase" className="text-blue-400" width={32} />
                  </div>
                  <h3 className="text-gray-400 text-sm">Total Jobs Posted</h3>
                  <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
                  <p className="text-green-400 text-xs mt-1">
                    {stats.activeJobs} active
                  </p>
                </CardBody>
              </Card>
              
              <Card className="glass-effect border-none">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon icon="lucide:dollar-sign" className="text-red-400" width={32} />
                  </div>
                  <h3 className="text-gray-400 text-sm">Total Spent</h3>
                  <p className="text-2xl font-bold text-white">${stats.totalSpent.toLocaleString()}</p>
                </CardBody>
              </Card>
            </>
          )}
          
          {isFreelancer && (
            <>
              <Card className="glass-effect border-none">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon icon="lucide:file-text" className="text-purple-400" width={32} />
                  </div>
                  <h3 className="text-gray-400 text-sm">Total Proposals</h3>
                  <p className="text-2xl font-bold text-white">{stats.totalProposals}</p>
                  <p className="text-green-400 text-xs mt-1">
                    {stats.acceptedProposals} accepted
                  </p>
                </CardBody>
              </Card>
              
              <Card className="glass-effect border-none">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon icon="lucide:dollar-sign" className="text-green-400" width={32} />
                  </div>
                  <h3 className="text-gray-400 text-sm">Total Earnings</h3>
                  <p className="text-2xl font-bold text-white">${stats.totalEarnings.toLocaleString()}</p>
                </CardBody>
              </Card>
            </>
          )}
          
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:check-circle" className="text-green-400" width={32} />
              </div>
              <h3 className="text-gray-400 text-sm">Completed Projects</h3>
              <p className="text-2xl font-bold text-white">{stats.completedProjects}</p>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon icon="lucide:star" className="text-yellow-400" width={32} />
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon 
                      key={star} 
                      icon="lucide:star" 
                      className={star <= Math.round(stats.rating) ? "text-yellow-400" : "text-gray-600"} 
                      width={16} 
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-gray-400 text-sm">Average Rating</h3>
              <p className="text-2xl font-bold text-white">{stats.rating.toFixed(1)}</p>
            </CardBody>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <Card className="glass-effect border-none mb-8">
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isClient && (
                <Button
                  variant="flat"
                  color="primary"
                  startContent={<Icon icon="lucide:plus" />}
                  onClick={() => navigate('/post-job')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <span>Post a Job</span>
                </Button>
              )}
              
              {isFreelancer && (
                <>
                  <Button
                    variant="flat"
                    color="secondary"
                    startContent={<Icon icon="lucide:search" />}
                    onClick={() => navigate('/looking-for-work')}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <span>Find Work</span>
                  </Button>
                  
                  <Button
                    variant="flat"
                    color="warning"
                    startContent={<Icon icon="lucide:file-text" />}
                    onClick={() => navigate('/proposals')}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <span>My Proposals</span>
                  </Button>
                </>
              )}
              
              {isClient && (
                <Button
                  variant="flat"
                  color="secondary"
                  startContent={<Icon icon="lucide:briefcase" />}
                  onClick={() => navigate('/jobs/manage')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <span>Manage Jobs</span>
                </Button>
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
              
              <Button
                variant="flat"
                color="default"
                startContent={<Icon icon="lucide:bell" />}
                onClick={() => navigate('/notifications')}
                className="h-auto py-4 flex-col gap-2"
              >
                <span>Notifications</span>
              </Button>
              
              <Button
                variant="flat"
                color="success"
                startContent={<Icon icon="lucide:credit-card" />}
                onClick={() => navigate('/billing')}
                className="h-auto py-4 flex-col gap-2"
              >
                <span>Billing</span>
              </Button>
              
              <Button
                variant="flat"
                color="default"
                startContent={<Icon icon="lucide:settings" />}
                onClick={() => navigate('/settings')}
                className="h-auto py-4 flex-col gap-2"
              >
                <span>Settings</span>
              </Button>
              
              {isFreelancer && (
                <Button
                  variant="flat"
                  color="primary"
                  startContent={<Icon icon="lucide:users" />}
                  onClick={() => navigate('/browse-freelancers')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <span>Browse Freelancers</span>
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isClient && recentJobs.length > 0 && (
            <Card className="glass-effect border-none">
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Jobs</h2>
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors cursor-pointer"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{job.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
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
                </div>
                <Button
                  variant="light"
                  color="primary"
                  fullWidth
                  className="mt-4"
                  onClick={() => navigate('/jobs/manage')}
                >
                  View All Jobs
                </Button>
              </CardBody>
            </Card>
          )}
          
          {isFreelancer && recentProposals.length > 0 && (
            <Card className="glass-effect border-none">
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Proposals</h2>
                <div className="space-y-3">
                  {recentProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{proposal.jobTitle}</h4>
                          <p className="text-gray-400 text-sm mt-1">
                            Proposed: ${proposal.proposedRate}
                          </p>
                        </div>
                        <Chip
                          size="sm"
                          color={getStatusColor(proposal.status)}
                          variant="flat"
                        >
                          {proposal.status}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="light"
                  color="primary"
                  fullWidth
                  className="mt-4"
                  onClick={() => navigate('/proposals')}
                >
                  View All Proposals
                </Button>
              </CardBody>
            </Card>
          )}
          
          {/* Profile Completion Card */}
          {isFreelancer && !userData?.profileCompleted && (
            <Card className="glass-effect border-none">
              <CardBody className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Complete Your Profile</h2>
                <p className="text-gray-400 mb-4">
                  A complete profile helps you stand out to clients and increases your chances of getting hired.
                </p>
                <Progress 
                  value={userData?.bio ? 50 : 25} 
                  color="warning"
                  className="mb-4"
                />
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
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;