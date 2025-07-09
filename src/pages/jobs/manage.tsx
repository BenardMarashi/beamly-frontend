import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  status: 'draft' | 'open' | 'in-progress' | 'completed' | 'cancelled';
  budget: number;
  budgetType: 'fixed' | 'hourly';
  proposals: number;
  createdAt: any;
  category: string;
}

export const ManageJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, canPostJobs } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!canPostJobs) {
      toast.error('Only clients can manage jobs');
      navigate('/dashboard');
    } else {
      fetchJobs();
    }
  }, [user, canPostJobs, navigate]);
  
  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('clientId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(jobsQuery);
      const jobsData: Job[] = [];
      
      querySnapshot.forEach((doc) => {
        jobsData.push({
          id: doc.id,
          ...doc.data()
        } as Job);
      });
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseJob = async () => {
    if (!selectedJob) return;
    
    try {
      await updateDoc(doc(db, 'jobs', selectedJob.id), {
        status: 'cancelled',
        updatedAt: new Date()
      });
      
      toast.success('Job closed successfully');
      fetchJobs();
      onClose();
    } catch (error) {
      console.error('Error closing job:', error);
      toast.error('Failed to close job');
    }
  };
  
  const filteredJobs = jobs.filter(job => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'active') return job.status === 'open' || job.status === 'in-progress';
    if (selectedTab === 'completed') return job.status === 'completed';
    return job.status === selectedTab;
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'in-progress': return 'primary';
      case 'completed': return 'secondary';
      case 'cancelled': return 'danger';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading jobs...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Manage Jobs</h1>
            <p className="text-gray-400">View and manage your posted jobs</p>
          </div>
          <Button
            color="primary"
            startContent={<Icon icon="lucide:plus" />}
            onPress={() => navigate('/post-job')}
          >
            Post New Job
          </Button>
        </div>
        
        <Card className="glass-effect border-none">
          <CardBody>
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key.toString())}
              classNames={{
                tabList: "bg-transparent",
                cursor: "bg-primary",
                tab: "text-gray-400",
                tabContent: "text-white group-data-[selected=true]:text-white"
              }}
            >
              <Tab key="all" title={`All (${jobs.length})`} />
              <Tab key="active" title={`Active (${jobs.filter(j => j.status === 'open' || j.status === 'in-progress').length})`} />
              <Tab key="completed" title={`Completed (${jobs.filter(j => j.status === 'completed').length})`} />
              <Tab key="cancelled" title={`Cancelled (${jobs.filter(j => j.status === 'cancelled').length})`} />
            </Tabs>
            
            <div className="mt-6">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="lucide:briefcase" className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No jobs found</p>
                </div>
              ) : (
                <Table
                  aria-label="Jobs table"
                  classNames={{
                    th: "bg-transparent text-gray-400",
                    td: "text-gray-300"
                  }}
                >
                  <TableHeader>
                    <TableColumn>TITLE</TableColumn>
                    <TableColumn>CATEGORY</TableColumn>
                    <TableColumn>BUDGET</TableColumn>
                    <TableColumn>PROPOSALS</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Button
                            variant="light"
                            onPress={() => navigate(`/jobs/${job.id}`)}
                            className="text-white hover:text-primary p-0"
                          >
                            {job.title}
                          </Button>
                        </TableCell>
                        <TableCell>{job.category}</TableCell>
                        <TableCell>
                          ${job.budget} {job.budgetType === 'hourly' && '/hr'}
                        </TableCell>
                        <TableCell>{job.proposals}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            color={getStatusColor(job.status)}
                            variant="flat"
                          >
                            {job.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => navigate(`/jobs/${job.id}/edit`)}
                            >
                              <Icon icon="lucide:edit" />
                            </Button>
                            {job.status === 'open' && (
                              <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                isIconOnly
                                onPress={() => {
                                  setSelectedJob(job);
                                  onOpen();
                                }}
                              >
                                <Icon icon="lucide:x" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardBody>
        </Card>
        
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Close Job</ModalHeader>
            <ModalBody>
              <p>Are you sure you want to close this job? This action cannot be undone.</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="danger" onPress={handleCloseJob}>
                Close Job
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
};

export default ManageJobsPage;