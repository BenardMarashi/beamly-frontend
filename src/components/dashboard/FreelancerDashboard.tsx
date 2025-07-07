import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Chip, Progress, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Proposal {
  id: string;
  jobId: string;
  jobTitle: string;
  proposedRate: number;
  status: string;
  createdAt: any;
}

interface Contract {
  id: string;
  title: string;
  clientName: string;
  rate: number;
  status: string;
}

export const FreelancerDashboard: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const { user, canApplyToJobs, userData } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProposals: 0,
    activeContracts: 0,
    completedJobs: 0,
    totalEarnings: 0
  });

  const isProfileComplete = userData?.profileCompleted || false;

  useEffect(() => {
    if (user) {
      fetchFreelancerData();
    }
  }, [user]);

  const fetchFreelancerData = async () => {
    if (!user) return;
    
    try {
      // Fetch recent proposals
      const proposalsQuery = query(
        collection(db, 'proposals'),
        where('freelancerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const proposalsSnapshot = await getDocs(proposalsQuery);
      const proposalsData = proposalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Proposal));
      setProposals(proposalsData);

      // Fetch active contracts
      const contractsQuery = query(
        collection(db, 'contracts'),
        where('freelancerId', '==', user.uid),
        where('status', '==', 'active'),
        limit(5)
      );
      const contractsSnapshot = await getDocs(contractsQuery);
      const contractsData = contractsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Contract));
      setContracts(contractsData);

      // Calculate stats
      const activeProposalsCount = proposalsData.filter(p => p.status === 'pending').length;
      
      setStats({
        activeProposals: activeProposalsCount,
        activeContracts: contractsData.length,
        completedJobs: 0, // This would come from completed contracts
        totalEarnings: 0 // This would come from earnings calculation
      });
    } catch (error) {
      console.error('Error fetching freelancer data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'default';
    }
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
                <p className="text-sm text-gray-500">Active Proposals</p>
                <p className="text-2xl font-semibold">{stats.activeProposals}</p>
              </div>
              <Icon icon="lucide:file-text" className="text-3xl text-blue-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card className={isDarkMode ? 'glass-effect' : ''}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Contracts</p>
                <p className="text-2xl font-semibold">{stats.activeContracts}</p>
              </div>
              <Icon icon="lucide:file-check" className="text-3xl text-green-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card className={isDarkMode ? 'glass-effect' : ''}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Jobs</p>
                <p className="text-2xl font-semibold">{stats.completedJobs}</p>
              </div>
              <Icon icon="lucide:check-circle" className="text-3xl text-purple-500" />
            </div>
          </CardBody>
        </Card>
        
        <Card className={isDarkMode ? 'glass-effect' : ''}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-semibold">${stats.totalEarnings}</p>
              </div>
              <Icon icon="lucide:dollar-sign" className="text-3xl text-yellow-500" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Proposals */}
      <Card className={isDarkMode ? 'glass-effect' : ''}>
        <CardBody className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Proposals</h3>
            {canApplyToJobs && isProfileComplete ? (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={() => navigate('/looking-for-work')}
              >
                Find Work
              </Button>
            ) : (
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onPress={() => navigate('/create-profile')}
              >
                Complete Profile
              </Button>
            )}
          </div>
          
          {proposals.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="lucide:file-text" className="text-4xl text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No proposals yet</p>
              <Button
                color="secondary"
                variant="flat"
                size="sm"
                className="mt-4"
                onPress={() => navigate(isProfileComplete ? '/looking-for-work' : '/create-profile')}
              >
                {isProfileComplete ? 'Browse Jobs' : 'Complete Profile First'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => navigate(`/jobs/${proposal.jobId}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{proposal.jobTitle}</h4>
                      <p className="text-sm text-gray-500">
                        Proposed: ${proposal.proposedRate}
                      </p>
                    </div>
                    <Chip
                      size="sm"
                      color={getProposalStatusColor(proposal.status)}
                      variant="flat"
                    >
                      {proposal.status}
                    </Chip>
                  </div>
                </div>
              ))}
              
              <Button
                variant="light"
                color="primary"
                fullWidth
                onPress={() => navigate('/proposals')}
              >
                View All Proposals
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Active Contracts */}
      {contracts.length > 0 && (
        <Card className={isDarkMode ? 'glass-effect' : ''}>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Contracts</h3>
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{contract.title}</h4>
                    <span className="text-sm font-semibold">${contract.rate}/hr</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Client: {contract.clientName}</p>
                  <Progress
                    size="sm"
                    value={60}
                    color="primary"
                    className="mb-1"
                  />
                  <p className="text-xs text-gray-500">60% Complete</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};