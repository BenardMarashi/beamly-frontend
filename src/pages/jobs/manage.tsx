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
  }, [user, canPostJobs, navigate, selectedTab]);
  
  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      let q = query(
        collection(db, 'jobs'),
        where('clientId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      if (selectedTab !== 'all') {
        q = query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid),
          where('status', '==', selectedTab),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      toast.success('Job status updated');
      fetchJobs();
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job status');
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'open':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };
  
  return (
    <div className="min-h-screen bg-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Manage Jobs</h1>
          <Button
            color="secondary"
            onPress={() => navigate('/post-job')}
            startContent={<Icon icon="lucide:plus" />}
          >
            Post New Job
          </Button>
        </div>
        
        <Card className="glass-card">
          <CardBody>
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              color="secondary"
              variant="underlined"
              classNames={{
                tabList: "border-b border-white/10",
                tab: "text-gray-400",
                selectedTab: "text-white"
              }}
            >
              <Tab key="all" title="All Jobs" />
              <Tab key="open" title="Open" />
              <Tab key="in-progress" title="In Progress" />
              <Tab key="completed" title="Completed" />
              <Tab key="draft" title="Drafts" />
            </Tabs>
            
            <div className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No jobs found</p>
                  <Button
                    color="secondary"
                    className="mt-4"
                    onPress={() => navigate('/post-job')}
                  >
                    Post Your First Job
                  </Button>
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
                    <TableColumn>POSTED</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <p className="font-medium text-white">{job.title}</p>
                        </TableCell>
                        <TableCell>{job.category}</TableCell>
                        <TableCell>
                          ${job.budget} {job.budgetType === 'hourly' && '/hr'}
                        </TableCell>
                        <TableCell>{job.proposals || 0}</TableCell>
                        <TableCell>
                          <Chip size="sm" color={getStatusColor(job.status)} variant="flat">
                            {job.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {job.createdAt?.toDate ? 
                            new Date(job.createdAt.toDate()).toLocaleDateString() : 
                            'Recently'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => navigate(`/jobs/${job.id}`)}
                            >
                              <Icon icon="lucide:eye" />
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              onPress={() => {
                                setSelectedJob(job);
                                onOpen();
                              }}
                            >
                              <Icon icon="lucide:edit" />
                            </Button>
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
        
        {/* Edit Job Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Edit Job Status</ModalHeader>
            <ModalBody>
              {selectedJob && (
                <div className="space-y-4">
                  <p className="text-gray-400">Job: {selectedJob.title}</p>
                  <div className="flex gap-2 flex-wrap">
                    {['open', 'in-progress', 'completed', 'cancelled'].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        color={getStatusColor(status)}
                        variant={selectedJob.status === status ? 'solid' : 'flat'}
                        onPress={() => handleStatusChange(selectedJob.id, status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
};