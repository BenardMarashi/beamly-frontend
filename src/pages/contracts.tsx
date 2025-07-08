import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tabs, Tab } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface Contract {
  id: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  rate: number;
  rateType: 'fixed' | 'hourly';
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  startDate: any;
  endDate?: any;
  totalAmount?: number;
  paidAmount?: number;
}

export const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchContracts();
    }
  }, [user, navigate, selectedTab]);
  
  const fetchContracts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // We need to run two separate queries since Firestore doesn't support OR in compound queries
      const contractsData: Contract[] = [];
      
      // Query 1: Where user is the client
      const clientQuery = query(
        collection(db, 'contracts'),
        where('clientId', '==', user.uid),
        orderBy('startDate', 'desc')
      );
      
      const clientSnapshot = await getDocs(clientQuery);
      clientSnapshot.forEach((doc) => {
        const data = doc.data();
        if (selectedTab === 'all' || data.status === selectedTab) {
          contractsData.push({
            id: doc.id,
            ...data
          } as Contract);
        }
      });
      
      // Query 2: Where user is the freelancer
      const freelancerQuery = query(
        collection(db, 'contracts'),
        where('freelancerId', '==', user.uid),
        orderBy('startDate', 'desc')
      );
      
      const freelancerSnapshot = await getDocs(freelancerQuery);
      freelancerSnapshot.forEach((doc) => {
        const data = doc.data();
        // Avoid duplicates and check status filter
        if (!contractsData.find(c => c.id === doc.id) && 
            (selectedTab === 'all' || data.status === selectedTab)) {
          contractsData.push({
            id: doc.id,
            ...data
          } as Contract);
        }
      });
      
      // Sort by startDate (newest first)
      contractsData.sort((a, b) => {
        const dateA = a.startDate?.toDate ? a.startDate.toDate() : new Date(0);
        const dateB = b.startDate?.toDate ? b.startDate.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setContracts(contractsData);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'danger';
      case 'disputed':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  const formatRate = (contract: Contract) => {
    return contract.rateType === 'fixed' 
      ? `$${contract.rate} (Fixed)` 
      : `$${contract.rate}/hr`;
  };
  
  const getOtherParty = (contract: Contract) => {
    if (user?.uid === contract.clientId) {
      return { name: contract.freelancerName, role: 'Freelancer' };
    } else {
      return { name: contract.clientName, role: 'Client' };
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading contracts...</p>
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
        <h1 className="text-3xl font-bold text-white mb-8">My Contracts</h1>
        
        <Card className="glass-effect border-none">
          <CardBody className="p-6">
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="mb-6"
            >
              <Tab key="all" title="All Contracts" />
              <Tab key="active" title="Active" />
              <Tab key="completed" title="Completed" />
              <Tab key="cancelled" title="Cancelled" />
              <Tab key="disputed" title="Disputed" />
            </Tabs>
            
            {contracts.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="lucide:file-signature" className="text-gray-400 mb-4" width={48} />
                <p className="text-gray-400">
                  {selectedTab === 'all' 
                    ? "You don't have any contracts yet" 
                    : `No ${selectedTab} contracts found`}
                </p>
                <Button
                  color="primary"
                  className="mt-4"
                  onClick={() => navigate(userData?.userType === 'client' ? '/post-job' : '/looking-for-work')}
                >
                  {userData?.userType === 'client' ? 'Post a Job' : 'Find Work'}
                </Button>
              </div>
            ) : (
              <Table aria-label="Contracts table" className="glass-effect">
                <TableHeader>
                  <TableColumn>PROJECT</TableColumn>
                  <TableColumn>OTHER PARTY</TableColumn>
                  <TableColumn>RATE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>STARTED</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => {
                    const otherParty = getOtherParty(contract);
                    return (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-white font-medium truncate">{contract.jobTitle}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">{otherParty.name}</p>
                            <p className="text-gray-400 text-xs">{otherParty.role}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-white">{formatRate(contract)}</p>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="sm" 
                            color={getStatusColor(contract.status)}
                            variant="flat"
                          >
                            {contract.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">${contract.totalAmount || contract.rate}</p>
                            {contract.paidAmount !== undefined && (
                              <p className="text-gray-400 text-xs">Paid: ${contract.paidAmount}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-400 text-sm">
                            {contract.startDate?.toDate ? 
                              new Date(contract.startDate.toDate()).toLocaleDateString() : 
                              'Recently'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onClick={() => navigate(`/contracts/${contract.id}`)}
                            >
                              <Icon icon="lucide:eye" className="text-gray-400" />
                            </Button>
                            {contract.status === 'active' && (
                              <Button
                                size="sm"
                                color="primary"
                                onClick={() => navigate('/chat')}
                              >
                                Message
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default ContractsPage;