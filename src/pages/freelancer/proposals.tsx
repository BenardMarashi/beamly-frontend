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
import { useTranslation } from 'react-i18next';
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
  proposedRate?: number;
  bidAmount: number;
  deliveryTime: string;
  estimatedDuration?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  projectStatus?: 'ongoing' | 'completed';
  createdAt: any;
  updatedAt?: any;
  paymentStatus?: 'pending' | 'escrow' | 'released';
}

export const FreelancerProposalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
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
      
      toast.success(t('freelancerProposals.success.updated'));
      onEditClose();
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error(t('freelancerProposals.errors.updateFailed'));
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
      return t('freelancerProposals.status.completedPaid');
    }
    if (status === 'accepted' && projectStatus === 'completed') {
      return t('freelancerProposals.status.completedAwaitingPayment');
    }
    if (status === 'accepted' && paymentStatus === 'escrow') {
      return t('freelancerProposals.status.inProgressPaymentSecured');
    }
    if (status === 'accepted' && projectStatus === 'ongoing') return t('freelancerProposals.status.inProgress');
    if (status === 'accepted') return t('freelancerProposals.status.accepted');
    if (status === 'pending') return t('freelancerProposals.status.pending');
    if (status === 'rejected') return t('freelancerProposals.status.rejected');
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
        <h1 className="text-3xl font-bold text-white mb-2">{t('freelancerProposals.title')}</h1>
        <p className="text-gray-400">{t('freelancerProposals.subtitle')}</p>
      </div>

      {proposals.length === 0 ? (
        <Card className="glass-effect">
          <CardBody className="text-center py-12">
            <Icon icon="lucide:file-text" className="text-6xl text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t('freelancerProposals.noProposals')}</h3>
            <p className="text-gray-400 mb-6">{t('freelancerProposals.noProposalsDesc')}</p>
            <Button 
              color="secondary"
              onPress={() => navigate('/looking-for-work')}
              startContent={<Icon icon="lucide:search" />}
            >
              {t('freelancerProposals.browseJobs')}
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
              <TableColumn>{t('freelancerProposals.table.jobTitle')}</TableColumn>
              <TableColumn>{t('freelancerProposals.table.client')}</TableColumn>
              <TableColumn>{t('freelancerProposals.table.bidAmount')}</TableColumn>
              <TableColumn>{t('freelancerProposals.table.delivery')}</TableColumn>
              <TableColumn>{t('freelancerProposals.table.status')}</TableColumn>
              <TableColumn>{t('freelancerProposals.table.submitted')}</TableColumn>
              <TableColumn>{t('freelancerProposals.table.actions')}</TableColumn>
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
                    <span className="font-semibold">€{proposal.bidAmount}</span>
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
                            {t('common.edit')}
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
                          {t('freelancerProposals.messageClient')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => navigate(`/job/${proposal.jobId}`)}
                      >
                        {t('freelancerProposals.viewJob')}
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
                <p className="text-sm text-gray-400">{t('freelancerProposals.table.client')}: {proposal.clientName}</p>
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
                  <span className="text-gray-400">{t('freelancerProposals.table.bidAmount')}:</span>
                  <span className="font-semibold">€{proposal.bidAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('freelancerProposals.table.delivery')}:</span>
                  <span>{proposal.deliveryTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('freelancerProposals.table.submitted')}:</span>
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
                      {t('common.edit')}
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
                    {t('freelancerProposals.messageClient')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => navigate(`/job/${proposal.jobId}`)}
                >
                  {t('freelancerProposals.viewJob')}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('freelancerProposals.editProposal')}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Textarea
                label={t('freelancerProposals.coverLetter')}
                placeholder={t('freelancerProposals.updateCoverLetter')}
                value={editForm.coverLetter}
                onChange={(e) => setEditForm({ ...editForm, coverLetter: e.target.value })}
                minRows={5}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label={t('freelancerProposals.bidAmountEuro')}
                  placeholder={t('freelancerProposals.enterAmount')}
                  value={editForm.bidAmount}
                  onChange={(e) => setEditForm({ ...editForm, bidAmount: e.target.value })}
                  startContent={<span className="text-gray-400">€</span>}
                />
                <Input
                  label={t('freelancerProposals.deliveryTime')}
                  placeholder={t('freelancerProposals.deliveryTimePlaceholder')}
                  value={editForm.deliveryTime}
                  onChange={(e) => setEditForm({ ...editForm, deliveryTime: e.target.value })}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              color="primary" 
              onPress={handleUpdateProposal}
              isDisabled={!editForm.coverLetter || !editForm.bidAmount || !editForm.deliveryTime}
            >
              {t('freelancerProposals.updateProposal')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};