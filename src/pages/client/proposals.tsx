// src/pages/client/proposals.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Avatar,
  Divider
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseService } from '../../services/firebase-services';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Proposal {
  id: string;
  jobId: string;
  jobTitle: string;
  freelancerId: string;
  freelancerName: string;
  freelancerPhotoURL?: string;
  freelancerRating?: number;
  freelancerCompletedJobs?: number;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: string;
  budgetType: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: any;
  attachments?: string[];
}

interface Job {
  id: string;
  title: string;
  proposals: Proposal[];
}

export const ClientProposalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (!user || (userData?.userType !== 'client' && userData?.userType !== 'both')) {
      navigate('/dashboard');
      return;
    }
    fetchProposals();
  }, [user, userData]);

  const fetchProposals = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all jobs posted by this client
      const jobsResult = await firebaseService.JobService.getUserJobs(user.uid, 'client');
      
      if (jobsResult.success && jobsResult.jobs) {
        // Fetch proposals for each job
        const jobsWithProposals = await Promise.all(
          jobsResult.jobs.map(async (job) => {
            const proposalsResult = await firebaseService.ProposalService.getJobProposals(job.id);
            return {
              id: job.id,
              title: job.title,
              proposals: proposalsResult.success ? proposalsResult.proposals || [] : []
            };
          })
        );
        
        // Filter out jobs with no proposals
        setJobs(jobsWithProposals.filter(job => job.proposals.length > 0));
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    onOpen();
  };

  const handleRejectProposal = async (proposalId: string) => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) return;
    
    setActionLoading(true);
    try {
      const result = await firebaseService.ProposalService.updateProposal(proposalId, {
        status: 'rejected'
      });
      
      if (result.success) {
        toast.success('Proposal rejected');
        fetchProposals();
      } else {
        toast.error('Failed to reject proposal');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptProposal = (proposal: Proposal) => {
    // Navigate to payment flow with proposal data
    navigate('/client/payment', {
      state: {
        proposalId: proposal.id,
        jobId: proposal.jobId,
        jobTitle: proposal.jobTitle,
        freelancerId: proposal.freelancerId,
        freelancerName: proposal.freelancerName,
        amount: proposal.proposedRate,
        budgetType: proposal.budgetType
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'withdrawn': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center">
          <Icon icon="lucide:loader-2" className="text-4xl animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading proposals...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Proposals</h1>
          <p className="text-gray-400">Review and manage proposals for your jobs</p>
        </div>

        {jobs.length === 0 ? (
          <Card className="glass-effect border-none">
            <CardBody className="text-center py-12">
              <Icon icon="lucide:inbox" className="text-6xl text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No proposals received yet</p>
              <Button
                color="primary"
                onPress={() => navigate('/post-job')}
                startContent={<Icon icon="lucide:plus" />}
              >
                Post a Job
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <Card key={job.id} className="glass-effect border-none">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-white">{job.title}</h2>
                  <Chip size="sm" className="ml-auto">
                    {job.proposals.length} proposal{job.proposals.length !== 1 ? 's' : ''}
                  </Chip>
                </CardHeader>
                <CardBody>
                  <Table
                    aria-label="Proposals table"
                    classNames={{
                      th: "bg-transparent text-gray-400",
                      td: "text-gray-300"
                    }}
                  >
                    <TableHeader>
                      <TableColumn>FREELANCER</TableColumn>
                      <TableColumn>RATE</TableColumn>
                      <TableColumn>DURATION</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>SUBMITTED</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {job.proposals.map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={proposal.freelancerPhotoURL}
                                name={proposal.freelancerName}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">{proposal.freelancerName}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  {proposal.freelancerRating && (
                                    <>
                                      <Icon icon="lucide:star" className="text-yellow-500" />
                                      <span>{proposal.freelancerRating.toFixed(1)}</span>
                                    </>
                                  )}
                                  {proposal.freelancerCompletedJobs !== undefined && (
                                    <span>• {proposal.freelancerCompletedJobs} jobs</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{formatCurrency(proposal.proposedRate)}</p>
                            <p className="text-xs text-gray-400">{proposal.budgetType}</p>
                          </TableCell>
                          <TableCell>{proposal.estimatedDuration}</TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={getStatusColor(proposal.status)}
                            >
                              {proposal.status}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {formatDistanceToNow(proposal.createdAt.toDate(), { addSuffix: true })}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="flat"
                                onPress={() => handleViewProposal(proposal)}
                                startContent={<Icon icon="lucide:eye" />}
                              >
                                View
                              </Button>
                              {proposal.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    onPress={() => handleRejectProposal(proposal.id)}
                                    isLoading={actionLoading}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="success"
                                    onPress={() => handleAcceptProposal(proposal)}
                                    startContent={<Icon icon="lucide:check" />}
                                  >
                                    Accept
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Proposal Details Modal */}
        <Modal 
          isOpen={isOpen} 
          onClose={onClose}
          size="2xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader>Proposal Details</ModalHeader>
            <ModalBody>
              {selectedProposal && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={selectedProposal.freelancerPhotoURL}
                      name={selectedProposal.freelancerName}
                      size="lg"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{selectedProposal.freelancerName}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        {selectedProposal.freelancerRating && (
                          <div className="flex items-center gap-1">
                            <Icon icon="lucide:star" className="text-yellow-500" />
                            <span>{selectedProposal.freelancerRating.toFixed(1)}</span>
                          </div>
                        )}
                        {selectedProposal.freelancerCompletedJobs !== undefined && (
                          <span>{selectedProposal.freelancerCompletedJobs} completed jobs</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Proposed Rate</p>
                      <p className="text-lg font-semibold">{formatCurrency(selectedProposal.proposedRate)}</p>
                      <p className="text-sm text-gray-400">{selectedProposal.budgetType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Estimated Duration</p>
                      <p className="text-lg font-semibold">{selectedProposal.estimatedDuration}</p>
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <h4 className="font-semibold mb-2">Cover Letter</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedProposal.coverLetter}</p>
                  </div>

                  {selectedProposal.attachments && selectedProposal.attachments.length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <h4 className="font-semibold mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {selectedProposal.attachments.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <Icon icon="lucide:paperclip" />
                              <span>Attachment {index + 1}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
              {selectedProposal?.status === 'pending' && (
                <>
                  <Button
                    color="danger"
                    variant="flat"
                    onPress={() => {
                      handleRejectProposal(selectedProposal.id);
                      onClose();
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    color="success"
                    onPress={() => {
                      handleAcceptProposal(selectedProposal);
                      onClose();
                    }}
                  >
                    Accept & Pay
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
};

export default ClientProposalsPage;