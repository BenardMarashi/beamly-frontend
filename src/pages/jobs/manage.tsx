import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Select, SelectItem, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/theme-context';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  status: string;
  category: string;
  budgetType: string;
  budgetMin: number;
  budgetMax: number;
  proposalCount: number;
  createdAt: any;
}

export const ManageJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user, statusFilter]);

  const fetchJobs = async () => {
    if (!user) return;
    
    try {
      let jobsQuery;
      
      if (statusFilter === 'all') {
        jobsQuery = query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
      } else {
        jobsQuery = query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(jobsQuery);
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));
      
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

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Manage Jobs
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            View and manage all your job postings
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Icon icon="lucide:plus" />}
          onPress={() => navigate('/post-job')}
        >
          Post New Job
        </Button>
      </div>

      {/* Filters */}
      <Card className={`mb-6 ${isDarkMode ? 'glass-effect' : ''}`}>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="lucide:search" />}
              className="md:w-96"
            />
            <Select
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="md:w-48"
              label="Status"
            >
              <SelectItem key="all" value="all">All Status</SelectItem>
              <SelectItem key="open" value="open">Open</SelectItem>
              <SelectItem key="in-progress" value="in-progress">In Progress</SelectItem>
              <SelectItem key="completed" value="completed">Completed</SelectItem>
              <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Jobs Table */}
      <Card className={isDarkMode ? 'glass-effect' : ''}>
        <CardBody className="p-0">
          <Table aria-label="Jobs table">
            <TableHeader>
              <TableColumn>JOB TITLE</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>BUDGET</TableColumn>
              <TableColumn>PROPOSALS</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>POSTED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No jobs found">
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="text-primary hover:underline text-left"
                    >
                      {job.title}
                    </button>
                  </TableCell>
                  <TableCell>{job.category}</TableCell>
                  <TableCell>{formatBudget(job)}</TableCell>
                  <TableCell>{job.proposalCount}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getStatusColor(job.status)}
                      variant="flat"
                    >
                      {job.status}
                    </Chip>
                  </TableCell>
                  <TableCell>{formatDate(job.createdAt)}</TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                        >
                          <Icon icon="lucide:more-vertical" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Job actions">
                        <DropdownItem
                          key="view"
                          startContent={<Icon icon="lucide:eye" />}
                          onPress={() => navigate(`/jobs/${job.id}`)}
                        >
                          View Details
                        </DropdownItem>
                        <DropdownItem
                          key="edit"
                          startContent={<Icon icon="lucide:edit" />}
                          onPress={() => navigate(`/jobs/${job.id}/edit`)}
                        >
                          Edit Job
                        </DropdownItem>
                        {job.status === 'open' && (
                          <DropdownItem
                            key="close"
                            startContent={<Icon icon="lucide:x-circle" />}
                            onPress={() => handleStatusChange(job.id, 'cancelled')}
                          >
                            Close Job
                          </DropdownItem>
                        )}
                        <DropdownItem
                          key="delete"
                          color="danger"
                          startContent={<Icon icon="lucide:trash" />}
                          onPress={() => {
                            setSelectedJob(job);
                            onOpen();
                          }}
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
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Delete Job</ModalHeader>
          <ModalBody>
            Are you sure you want to delete "{selectedJob?.title}"? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleDeleteJob}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ManageJobsPage;