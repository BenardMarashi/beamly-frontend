// src/pages/freelancer/proposals.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button, 
  Chip, 
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Proposal {
  id: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName?: string;
  freelancerId: string;
  freelancerName?: string;
  freelancerAvatar?: string;
  freelancerRating?: number;
  coverLetter: string;
  proposedRate?: number; // This might be the field name in your DB
  bidAmount: number;
  deliveryTime: string;
  estimatedDuration?: string; // This might be the actual field
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  projectStatus?: 'ongoing' | 'completed';
  createdAt: any;
  updatedAt?: any;
  paymentStatus?: 'pending' | 'escrow' | 'released';
}

export const FreelancerProposalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [editForm, setEditForm] = useState({
    coverLetter: '',
    bidAmount: '',
    deliveryTime: ''
  });
  
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const q = query(
      collection(db, 'proposals'),
      where('freelancerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const proposalsData: Proposal[] = [];
      snapshot.forEach((doc) => {
        proposalsData.push({
          id: doc.id,
          ...doc.data()
        } as Proposal);
      });
      setProposals(proposalsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const handleEditProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setEditForm({
      coverLetter: proposal.coverLetter,
      bidAmount: proposal.bidAmount.toString(),
      deliveryTime: proposal.deliveryTime
    });
    onEditOpen();
  };

  const handleUpdateProposal = async () => {
    if (!selectedProposal) return;

    try {
      await updateDoc(doc(db, 'proposals', selectedProposal.id), {
        coverLetter: editForm.coverLetter,
        bidAmount: parseFloat(editForm.bidAmount),
        deliveryTime: editForm.deliveryTime,
        updatedAt: new Date()
      });
      
      toast.success('Proposal updated successfully');
      onEditClose();
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('Failed to update proposal');
    }
  };


  const getStatusColor = (status: string, projectStatus?: string) => {
    if (status === 'accepted' && projectStatus === 'ongoing') return 'primary';
    if (status === 'accepted' && projectStatus === 'completed') return 'success';
    
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'withdrawn': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string, projectStatus?: string, paymentStatus?: string) => {
    if (status === 'accepted' && projectStatus === 'completed' && paymentStatus === 'released') {
      return 'Completed - Paid';
    }
    if (status === 'accepted' && projectStatus === 'completed') {
      return 'Completed - Awaiting Payment';
    }
    if (status === 'accepted' && paymentStatus === 'escrow') {
      return 'In Progress - Payment Secured';
    }
    if (status === 'accepted' && projectStatus === 'ongoing') return 'In Progress';
    if (status === 'accepted') return 'Accepted';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Proposals</h1>
        <p className="text-gray-400">Track and manage your job proposals</p>
      </div>

      {proposals.length === 0 ? (
        <Card className="glass-effect">
          <CardBody className="text-center py-12">
            <Icon icon="lucide:file-text" className="text-6xl text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No proposals yet</h3>
            <p className="text-gray-400 mb-6">Start applying to jobs to see your proposals here</p>
            <Button 
              color="secondary"
              onPress={() => navigate('/looking-for-work')}
              startContent={<Icon icon="lucide:search" />}
            >
              Browse Jobs
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="hidden md:block">
          <Table 
            aria-label="Proposals table"
            classNames={{
              wrapper: "glass-effect",
              th: "bg-transparent text-gray-400",
              td: "text-gray-300"
            }}
          >
            <TableHeader>
              <TableColumn>JOB TITLE</TableColumn>
              <TableColumn>CLIENT</TableColumn>
              <TableColumn>BID AMOUNT</TableColumn>
              <TableColumn>DELIVERY</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>SUBMITTED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium text-white truncate">{proposal.jobTitle}</p>
                    </div>
                  </TableCell>
                  <TableCell>{proposal.clientName}</TableCell>
                  <TableCell>
                    <span className="font-semibold">${proposal.bidAmount}</span>
                  </TableCell>
                  <TableCell>{proposal.deliveryTime}</TableCell>
                  <TableCell>
                    <Chip 
                      size="sm"
                      color={getStatusColor(proposal.status, proposal.projectStatus)}
                      variant="flat"
                    >
                      {getStatusText(proposal.status, proposal.projectStatus, proposal.paymentStatus)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDistanceToNow(proposal.createdAt?.toDate?.() || new Date(), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {proposal.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => handleEditProposal(proposal)}
                            startContent={<Icon icon="lucide:edit" />}
                          >
                            Edit
                          </Button>
                        </>
                      )}
                      {proposal.status === 'accepted' && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => navigate(`/messages?user=${proposal.clientId}`)}
                          startContent={<Icon icon="lucide:message-circle" />}
                        >
                          Message Client
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => navigate(`/job/${proposal.jobId}`)}
                      >
                        View Job
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id} className="glass-card">
            <CardHeader className="flex justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-white">{proposal.jobTitle}</h3>
                <p className="text-sm text-gray-400">Client: {proposal.clientName}</p>
              </div>
              <Chip 
                size="sm"
                color={getStatusColor(proposal.status, proposal.projectStatus)}
                variant="flat"
              >
                {getStatusText(proposal.status, proposal.projectStatus, proposal.paymentStatus)}
              </Chip>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bid Amount:</span>
                  <span className="font-semibold">${proposal.bidAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Delivery:</span>
                  <span>{proposal.deliveryTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Submitted:</span>
                  <span className="text-sm">
                    {formatDistanceToNow(proposal.createdAt?.toDate?.() || new Date(), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {proposal.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleEditProposal(proposal)}
                      startContent={<Icon icon="lucide:edit" />}
                    >
                      Edit
                    </Button>
                  </>
                )}
                {proposal.status === 'accepted' && (
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => navigate(`/messages?user=${proposal.clientId}`)}
                    startContent={<Icon icon="lucide:message-circle" />}
                  >
                    Message Client
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => navigate(`/job/${proposal.jobId}`)}
                >
                  View Job
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalContent>
          <ModalHeader>Edit Proposal</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Textarea
                label="Cover Letter"
                placeholder="Update your cover letter..."
                value={editForm.coverLetter}
                onChange={(e) => setEditForm({ ...editForm, coverLetter: e.target.value })}
                minRows={5}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Bid Amount ($)"
                  placeholder="Enter amount"
                  value={editForm.bidAmount}
                  onChange={(e) => setEditForm({ ...editForm, bidAmount: e.target.value })}
                  startContent={<span className="text-gray-400">$</span>}
                />
                <Input
                  label="Delivery Time"
                  placeholder="e.g., 3 days"
                  value={editForm.deliveryTime}
                  onChange={(e) => setEditForm({ ...editForm, deliveryTime: e.target.value })}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleUpdateProposal}
              isDisabled={!editForm.coverLetter || !editForm.bidAmount || !editForm.deliveryTime}
            >
              Update Proposal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};