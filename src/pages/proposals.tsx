import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tabs, Tab } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface Proposal {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  proposedRate: number;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: any;
  budgetType: string;
}

export const ProposalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isFreelancer } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!isFreelancer) {
      toast.error('Only freelancers can view proposals');
      navigate('/dashboard');
    } else {
      fetchProposals();
    }
  }, [user, isFreelancer, navigate, selectedTab]);
  
  const fetchProposals = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let q = query(
        collection(db, 'proposals'),
        where('freelancerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      if (selectedTab !== 'all') {
        q = query(
          collection(db, 'proposals'),
          where('freelancerId', '==', user.uid),
          where('status', '==', selectedTab),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const proposalsData: Proposal[] = [];
      
      querySnapshot.forEach((doc) => {
        proposalsData.push({
          id: doc.id,
          ...doc.data()
        } as Proposal);
      });
      
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'withdrawn':
        return 'default';
      default:
        return 'default';
    }
  };
  
  const formatRate = (proposal: Proposal) => {
    return proposal.budgetType === 'fixed' 
      ? `$${proposal.proposedRate} (Fixed)` 
      : `$${proposal.proposedRate}/hr`;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading proposals...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">My Proposals</h1>
        
        <Card className="glass-effect border-none">
          <CardBody className="p-6">
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="mb-6"
            >
              <Tab key="all" title="All Proposals" />
              <Tab key="pending" title="Pending" />
              <Tab key="accepted" title="Accepted" />
              <Tab key="rejected" title="Rejected" />
              <Tab key="withdrawn" title="Withdrawn" />
            </Tabs>
            
            {proposals.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="lucide:file-text" className="text-gray-400 mb-4" width={48} />
                <p className="text-gray-400">
                  {selectedTab === 'all' 
                    ? "You haven't submitted any proposals yet" 
                    : `No ${selectedTab} proposals found`}
                </p>
                {selectedTab === 'all' && (
                  <Button
                    color="primary"
                    className="mt-4"
                    onClick={() => navigate('/looking-for-work')}
                  >
                    Browse Available Jobs
                  </Button>
                )}
              </div>
            ) : (
              <Table aria-label="Proposals table" className="glass-effect">
                <TableHeader>
                  <TableColumn>JOB TITLE</TableColumn>
                  <TableColumn>CLIENT</TableColumn>
                  <TableColumn>PROPOSED RATE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>SUBMITTED</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-white font-medium truncate">{proposal.jobTitle}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-white">{proposal.clientName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-white">{formatRate(proposal)}</p>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="sm" 
                          color={getStatusColor(proposal.status)}
                          variant="flat"
                        >
                          {proposal.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <p className="text-gray-400 text-sm">
                          {proposal.createdAt?.toDate ? 
                            new Date(proposal.createdAt.toDate()).toLocaleDateString() : 
                            'Recently'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onClick={() => navigate(`/jobs/${proposal.jobId}`)}
                          >
                            <Icon icon="lucide:eye" className="text-gray-400" />
                          </Button>
                          {proposal.status === 'accepted' && (
                            <Button
                              size="sm"
                              color="primary"
                              onClick={() => navigate('/chat')}
                            >
                              Message Client
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProposalsPage;