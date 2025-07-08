import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  category: string;
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax: number;
  status: string;
  proposalCount: number;
  createdAt: any;
  viewCount: number;
}

export const ManageJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData, canPostJobs } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
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
  }, [user, canPostJobs, navigate, filterStatus]);
  
  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let q;
      
      if (filterStatus === 'all') {
        q = query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid),
          where('status', '==', filterStatus),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
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
  
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      toast.success(`Job status updated to ${newStatus}`);
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };
  
  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    
    try {
      await deleteDoc(doc(db, 'jobs', selectedJob.id));
      toast.success('Job deleted successfully');
      onClose();
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'in-progress':
        return 'primary';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };
  
  const formatBudget = (job: Job) => {
    if (job.budgetType === 'fixed') {
      return `$${job.budgetMin}`;
    } else {
      return `$${job.budgetMin} - $${job.budgetMax}/hr`;
    }
  };
  
  const statusOptions = [
    { value: "all", label: "All Jobs" },
    { value: "open", label: "Open" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" }
  ];

  const handleDropdownAction = (key: React.Key, job: Job) => {
    switch (key) {
      case 'view':
        navigate(`/jobs/${job.id}`);
        break;
      case 'edit':
        navigate(`/jobs/${job.id}/edit`);
        break;
      case 'close':
        handleStatusChange(job.id, 'cancelled');
        break;
      case 'delete':
        setSelectedJob(job);
        onOpen();
        break;
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
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Manage Jobs</h1>
          <Button
            color="primary"
            startContent={<Icon icon="lucide:plus" />}
            onClick={() => navigate('/post-job')}
          >
            Post New Job
          </Button>
        </div>
        
        <Card className="glass-effect border-none mb-6">
          <CardBody className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Your Jobs</h2>
              <Select
                label="Filter by status"
                selectedKeys={[filterStatus]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFilterStatus(selected);
                }}
                className="w-48"
                variant="bordered"
              >
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="lucide:briefcase" className="text-gray-400 mb-4" width={48} />
                <p className="text-gray-400">
                  {filterStatus === 'all' 
                    ? "You haven't posted any jobs yet" 
                    : `No ${filterStatus} jobs found`}
                </p>
                {filterStatus === 'all' && (
                  <Button
                    color="primary"
                    className="mt-4"
                    onClick={() => navigate('/post-job')}
                  >
                    Post Your First Job
                  </Button>
                )}
              </div>
            ) : (
              <Table aria-label="Jobs table" className="glass-effect">
                <TableHeader>
                  <TableColumn>JOB TITLE</TableColumn>
                  <TableColumn>CATEGORY</TableColumn>
                  <TableColumn>BUDGET</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>PROPOSALS</TableColumn>
                  <TableColumn>VIEWS</TableColumn>
                  <TableColumn>POSTED</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-white font-medium truncate">{job.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {job.category}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <p className="text-white">{formatBudget(job)}</p>
                      </TableCell>
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
                        <p className="text-white">{job.proposalCount}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-white">{job.viewCount || 0}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-gray-400 text-sm">
                          {job.createdAt?.toDate ? 
                            new Date(job.createdAt.toDate()).toLocaleDateString() : 
                            'Recently'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <Icon icon="lucide:more-vertical" className="text-gray-400" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu 
                            aria-label="Job actions"
                            onAction={(key) => handleDropdownAction(key, job)}
                            disabledKeys={job.status !== 'open' ? ['close'] : []}
                          >
                            <DropdownItem
                              key="view"
                              startContent={<Icon icon="lucide:eye" />}
                            >
                              View Job
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={<Icon icon="lucide:edit" />}
                            >
                              Edit Job
                            </DropdownItem>
                            <DropdownItem
                              key="close"
                              startContent={<Icon icon="lucide:x-circle" />}
                              className="text-warning"
                            >
                              Close Job
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              color="danger"
                              startContent={<Icon icon="lucide:trash" />}
                              className="text-danger"
                            >
                              Delete Job
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
        
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Confirm Delete</ModalHeader>
            <ModalBody>
              <p>Are you sure you want to delete "{selectedJob?.title}"?</p>
              <p className="text-sm text-gray-400 mt-2">
                This action cannot be undone. All proposals for this job will also be removed.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="danger" onPress={handleDeleteJob}>
                Delete Job
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
};