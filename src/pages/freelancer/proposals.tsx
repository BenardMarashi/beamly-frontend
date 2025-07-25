// src/pages/freelancer/proposals.tsx
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
  Textarea,
  Input
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseService } from '../../services/firebase-services';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export const FreelancerProposalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Edit form state
  const [editedCoverLetter, setEditedCoverLetter] = useState('');
  const [editedRate, setEditedRate] = useState('');
  const [editedDuration, setEditedDuration] = useState('');
  
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();

  useEffect(() => {
    if (!user || (userData?.userType !== 'freelancer' && userData?.userType !== 'both')) {
      navigate('/dashboard');
      return;
    }
    fetchProposals();
  }, [user, userData]);

  const fetchProposals = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await firebaseService.ProposalService.getUserProposals(user.uid);
      
      if (result.success && result.proposals) {
        setProposals(result.proposals);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProposal = (proposal: any) => {
    setSelectedProposal(proposal);
    setEditedCoverLetter(proposal.coverLetter);
    setEditedRate(proposal.proposedRate.toString());
    setEditedDuration(proposal.estimatedDuration);
    onEditOpen();
  };

  const handleSaveEdit = async () => {
    if (!selectedProposal) return;
    
    setActionLoading(true);
    try {
      const result = await firebaseService.ProposalService.updateProposal(selectedProposal.id, {
        coverLetter: editedCoverLetter,
        proposedRate: parseFloat(editedRate),
        estimatedDuration: editedDuration
      });
      
      if (result.success) {
        toast.success('Proposal updated successfully');
        fetchProposals();
        onEditClose();
      } else {
        toast.error('Failed to update proposal');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawProposal = async (proposalId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this proposal?')) return;
    
    setActionLoading(true);
    try {
      const result = await firebaseService.ProposalService.withdrawProposal(proposalId);
      
      if (result.success) {
        toast.success('Proposal withdrawn');
        fetchProposals();
      } else {
        toast.error('Failed to withdraw proposal');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-white mb-2">My Proposals</h1>
          <p className="text-gray-400">Track and manage your submitted proposals</p>
        </div>

        {proposals.length === 0 ? (
          <Card className="glass-effect border-none">
            <CardBody className="text-center py-12">
              <Icon icon="lucide:file-text" className="text-6xl text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">You haven't submitted any proposals yet</p>
              <Button
                color="primary"
                onPress={() => navigate('/jobs')}
                startContent={<Icon icon="lucide:search" />}
              >
                Browse Jobs
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card className="glass-effect border-none">
            <CardBody>
              <Table
                aria-label="Proposals table"
                classNames={{
                  th: "bg-transparent text-gray-400",
                  td: "text-gray-300"
                }}
              >
                <TableHeader>
                  <TableColumn>JOB</TableColumn>
                  <TableColumn>CLIENT</TableColumn>
                  <TableColumn>RATE</TableColumn>
                  <TableColumn>DURATION</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>SUBMITTED</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <p className="font-medium">{proposal.jobTitle}</p>
                      </TableCell>
                      <TableCell>{proposal.clientName || 'Unknown Client'}</TableCell>
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
                          {proposal.createdAt?.toDate ? 
                            formatDistanceToNow(proposal.createdAt.toDate(), { addSuffix: true }) :
                            'Recently'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => navigate(`/job/${proposal.jobId}`)}
                            startContent={<Icon icon="lucide:external-link" />}
                          >
                            View Job
                          </Button>
                          {proposal.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                onPress={() => handleEditProposal(proposal)}
                                startContent={<Icon icon="lucide:edit" />}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={() => handleWithdrawProposal(proposal.id)}
                                isLoading={actionLoading}
                              >
                                Withdraw
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
        )}

        {/* Edit Proposal Modal */}
        <Modal 
          isOpen={isEditOpen} 
          onClose={onEditClose}
          size="2xl"
        >
          <ModalContent>
            <ModalHeader>Edit Proposal</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Cover Letter</label>
                  <Textarea
                    value={editedCoverLetter}
                    onChange={(e) => setEditedCoverLetter(e.target.value)}
                    minRows={6}
                    placeholder="Explain why you're the best fit for this job..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Proposed Rate</label>
                    <Input
                      type="number"
                      value={editedRate}
                      onChange={(e) => setEditedRate(e.target.value)}
                      startContent={<span className="text-gray-400">€</span>}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Estimated Duration</label>
                    <Input
                      value={editedDuration}
                      onChange={(e) => setEditedDuration(e.target.value)}
                      placeholder="e.g., 2 weeks"
                    />
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onEditClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSaveEdit}
                isLoading={actionLoading}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
};

export default FreelancerProposalsPage;