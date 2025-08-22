// src/pages/client/proposals.tsx
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
  useDisclosure,
  Spinner,
  Avatar,
  Divider,
  Textarea,
  RadioGroup,
  Radio
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { StripeService } from '../../services/stripe-service';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

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
  deliveryTime?: string;
  estimatedDuration?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  projectStatus?: 'ongoing' | 'completed';
  createdAt: any;
  updatedAt?: any;
  paymentStatus?: 'pending' | 'escrow' | 'released';
}

interface Job {
  id: string;
  title: string;
  clientId: string;
}

export const ClientProposalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Rating state
  const [rating, setRating] = useState('');
  const [review, setReview] = useState('');
  
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isRatingOpen, onOpen: onRatingOpen, onClose: onRatingClose } = useDisclosure();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch user's jobs
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const jobsUnsubscribe = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData: Job[] = [];
      snapshot.forEach((doc) => {
        jobsData.push({
          id: doc.id,
          ...doc.data()
        } as Job);
      });
      setJobs(jobsData);
    });

    // Fetch proposals for user's jobs
    const proposalsQuery = query(
      collection(db, 'proposals'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const proposalsUnsubscribe = onSnapshot(proposalsQuery, (snapshot) => {
      const fetchProposalsData = async () => {
        const proposalsData: Proposal[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          
          try {
            // Fetch freelancer details
            const freelancerDoc = await getDoc(doc(db, 'users', data.freelancerId));
            const freelancerData = freelancerDoc.data();
            
            proposalsData.push({
              id: docSnapshot.id,
              ...data,
              freelancerName: freelancerData?.displayName || t('common.unknown'),
              freelancerAvatar: freelancerData?.photoURL,
              freelancerRating: freelancerData?.rating || 0
            } as Proposal);
          } catch (error) {
            console.error('Error fetching freelancer data:', error);
            // Still add the proposal even if freelancer data fails
            proposalsData.push({
              id: docSnapshot.id,
              ...data,
              freelancerName: data.freelancerName || t('common.unknown'),
              freelancerAvatar: '',
              freelancerRating: 0
            } as Proposal);
          }
        }
        
        setProposals(proposalsData);
        setLoading(false);
      };
      
      fetchProposalsData();
    });

    return () => {
      jobsUnsubscribe();
      proposalsUnsubscribe();
    };
  }, [user, navigate]);

  const handleAcceptProposal = async (proposal: any) => {
    // Debug and validate amount
    console.log('Full proposal data:', proposal);
    
    // Try multiple fields to get the amount
    let amount = 0;
    
    // Check different possible field names
    if (proposal.bidAmount !== undefined && proposal.bidAmount !== null) {
      amount = parseFloat(proposal.bidAmount.toString());
    } else if (proposal.proposedRate !== undefined && proposal.proposedRate !== null) {
      amount = parseFloat(proposal.proposedRate.toString());
    } else if (proposal.amount !== undefined && proposal.amount !== null) {
      amount = parseFloat(proposal.amount.toString());
    }
    
    console.log('Parsed amount:', amount);

    // Validate amount - Stripe minimum is €0.50
    if (isNaN(amount) || amount < 0.50) {
      toast.error(t('clientProposals.errors.invalidAmount', { amount: amount || 0 }));
      return;
    }
    
    setSelectedProposal(proposal);
    setProcessingPayment(true);
    
    try {
      // Navigate to payment page with validated amount
      navigate('/client/payment', {
        state: {
          proposalId: proposal.id,
          jobId: proposal.jobId,
          jobTitle: proposal.jobTitle,
          freelancerId: proposal.freelancerId,
          freelancerName: proposal.freelancerName,
          amount: amount, // This is now guaranteed to be a valid number >= 0.50
          budgetType: proposal.budgetType || 'fixed'
        }
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('clientProposals.errors.paymentFailed'));
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    if (!window.confirm(t('clientProposals.confirmReject'))) return;

    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        status: 'rejected',
        rejectedAt: new Date()
      });
      toast.success(t('clientProposals.success.rejected'));
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error(t('clientProposals.errors.rejectFailed'));
    }
  };

  const handleMarkAsFinished = async (proposalId: string) => {
    if (!window.confirm(t('clientProposals.confirmFinish'))) {
      return;
    }

    try {
      // First, release the payment
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) {
        toast.error(t('clientProposals.errors.proposalNotFound'));
        return;
      }

      // Call the release payment function
      const releasePayment = httpsCallable(functions, 'releasePaymentToFreelancer');
      const result = await releasePayment({
        jobId: proposal.jobId,
        freelancerId: proposal.freelancerId
      });

      if ((result.data as any).success) {
        // Update proposal status
        await updateDoc(doc(db, 'proposals', proposalId), {
          projectStatus: 'completed',
          completedAt: new Date(),
          paymentStatus: 'released'
        });

        // Update job status
        await updateDoc(doc(db, 'jobs', proposal.jobId), {
          status: 'completed',
          completedAt: new Date()
        });

        await updateDoc(doc(db, 'users', proposal.freelancerId), {
          completedProjects: increment(1)
        });

        toast.success(t('clientProposals.success.completed'));
        
        // Open rating modal
        setSelectedProposal(proposal);
        onRatingOpen();
      } else {
        throw new Error('Failed to release payment');
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error(t('clientProposals.errors.completeFailed'));
    }
  };

  const handleCompleteProject = async (proposalId: string) => {
    if (!window.confirm(t('clientProposals.confirmComplete'))) return;

    try {
      // Get the proposal first
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) {
        toast.error(t('clientProposals.errors.proposalNotFound'));
        return;
      }

      await updateDoc(doc(db, 'proposals', proposalId), {
        projectStatus: 'completed',
        completedAt: new Date()
      });
      
      // ADD THIS HERE - Increment freelancer's completed projects
      await updateDoc(doc(db, 'users', proposal.freelancerId), {
        completedProjects: increment(1)
      });
      
      // Open rating modal
      if (proposal) {
        setSelectedProposal(proposal);
        onRatingOpen();
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error(t('clientProposals.errors.completeFailed'));
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedProposal || !rating) return;

    try {
      // Add review
      await addDoc(collection(db, 'reviews'), {
        freelancerId: selectedProposal.freelancerId,
        clientId: user!.uid,
        clientName: userData?.displayName || t('common.client'),
        proposalId: selectedProposal.id,
        jobId: selectedProposal.jobId,
        rating: parseInt(rating),
        review: review,
        createdAt: new Date()
      });

      // Update freelancer's rating
      const freelancerDoc = await getDoc(doc(db, 'users', selectedProposal.freelancerId));
      const currentData = freelancerDoc.data();
      const currentRating = currentData?.rating || 0;
      const currentCount = currentData?.ratingCount || 0;
      
      const newRating = ((currentRating * currentCount) + parseInt(rating)) / (currentCount + 1);
      
      await updateDoc(doc(db, 'users', selectedProposal.freelancerId), {
        rating: newRating,
        ratingCount: currentCount + 1
      });

      toast.success(t('clientProposals.success.reviewSubmitted'));
      onRatingClose();
      setRating('');
      setReview('');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('clientProposals.errors.reviewFailed'));
    }
  };

  const viewProposalDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    onDetailOpen();
  };

  const filteredProposals = selectedJob === 'all' 
    ? proposals 
    : proposals.filter(p => p.jobId === selectedJob);

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
        <h1 className="text-3xl font-bold text-white mb-2">{t('clientProposals.title')}</h1>
        <p className="text-gray-400">{t('clientProposals.subtitle')}</p>
      </div>

      {/* Job Filter */}
      <div className="mb-6">
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2"
        >
          <option value="all">{t('clientProposals.allJobs')}</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>{job.title}</option>
          ))}
        </select>
      </div>

      {filteredProposals.length === 0 ? (
        <Card className="glass-effect">
          <CardBody className="text-center py-12">
            <Icon icon="lucide:inbox" className="text-6xl text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t('clientProposals.noProposals')}</h3>
            <p className="text-gray-400 mb-6">
              {selectedJob === 'all' 
                ? t('clientProposals.noProposalsDesc')
                : t('clientProposals.noProposalsForJob')}
            </p>
            <Button 
              color="secondary"
              onPress={() => navigate('/post-job')}
              startContent={<Icon icon="lucide:plus" />}
            >
              {t('clientProposals.postJob')}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProposals.map((proposal) => (
            <Card key={proposal.id} className="glass-card">
              <CardBody className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <Avatar
                    src={proposal.freelancerAvatar}
                    name={proposal.freelancerName}
                    size="lg"
                    className="cursor-pointer"
                    onClick={() => navigate(`/freelancer/${proposal.freelancerId}`)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 
                          className="font-semibold text-white hover:underline cursor-pointer"
                          onClick={() => navigate(`/freelancer/${proposal.freelancerId}`)}
                        >
                          {proposal.freelancerName}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {t('clientProposals.for')}: {proposal.jobTitle}
                        </p>
                        {proposal.freelancerRating !== undefined && proposal.freelancerRating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Icon icon="lucide:star" className="text-yellow-400" />
                            <span className="text-sm">{proposal.freelancerRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <Chip 
                        size="sm"
                        color={
                          proposal.status === 'accepted' && proposal.projectStatus === 'completed' && proposal.paymentStatus === 'released' ? 'success' :
                          proposal.status === 'accepted' && proposal.projectStatus === 'ongoing' ? 'primary' :
                          proposal.status === 'accepted' && proposal.projectStatus === 'completed' ? 'warning' :
                          proposal.status === 'pending' ? 'warning' :
                          proposal.status === 'rejected' ? 'danger' : 'default'
                        }
                        variant="flat"
                      >
                        {proposal.status === 'accepted' && proposal.projectStatus === 'completed' && proposal.paymentStatus === 'released' ? t('clientProposals.status.completedPaid') :
                        proposal.status === 'accepted' && proposal.projectStatus === 'ongoing' ? t('clientProposals.status.inProgress') :
                        proposal.status === 'accepted' && proposal.projectStatus === 'completed' ? t('clientProposals.status.completedPending') :
                        proposal.status === 'pending' ? t('clientProposals.status.pending') :
                        proposal.status === 'rejected' ? t('clientProposals.status.rejected') :
                        proposal.status}
                      </Chip>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-400">{t('clientProposals.bidAmount')}:</p>
                        <p className="font-semibold text-white">€{proposal.bidAmount || proposal.proposedRate || 0}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-400">{t('clientProposals.delivery')}:</p>
                        <p className="text-white">{proposal.deliveryTime || proposal.estimatedDuration || t('clientProposals.notSpecified')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-400">{t('clientProposals.submitted')}:</p>
                        <p className="text-white text-sm">
                          {formatDistanceToNow(proposal.createdAt?.toDate?.() || new Date(), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4 line-clamp-2">{proposal.coverLetter}</p>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => viewProposalDetails(proposal)}
                      >
                        {t('clientProposals.viewDetails')}
                      </Button>
                      
                      {proposal.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            color="secondary"
                            onPress={() => handleAcceptProposal(proposal)}
                            isLoading={processingPayment}
                          >
                            {t('clientProposals.acceptPay')}
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => handleRejectProposal(proposal.id)}
                          >
                            {t('clientProposals.reject')}
                          </Button>
                        </>
                      )}
                      
                      {proposal.status === 'accepted' && proposal.projectStatus !== 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            startContent={<Icon icon="lucide:message-circle" />}
                            onPress={() => navigate(`/messages?user=${proposal.freelancerId}`)}
                          >
                            {t('clientProposals.message')}
                          </Button>
                          <Button
                            size="sm"
                            color="success"
                            startContent={<Icon icon="lucide:check-circle" />}
                            onPress={() => handleMarkAsFinished(proposal.id)}
                          >
                            {t('clientProposals.markFinished')}
                          </Button>
                        </>
                      )}
                      
                      {proposal.status === 'accepted' && proposal.projectStatus === 'completed' && (
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<Icon icon="lucide:star" />}
                          onPress={() => {
                            setSelectedProposal(proposal);
                            onRatingOpen();
                          }}
                        >
                          {t('clientProposals.rateFreelancer')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Proposal Details Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t('clientProposals.proposalDetails')}</ModalHeader>
          <ModalBody>
            {selectedProposal && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={selectedProposal.freelancerAvatar}
                    name={selectedProposal.freelancerName}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-semibold text-white">{selectedProposal.freelancerName}</h3>
                    <p className="text-sm text-gray-400">{t('clientProposals.for')}: {selectedProposal.jobTitle}</p>
                  </div>
                </div>
                
                <Divider />
                
                <div>
                  <h4 className="font-semibold text-white mb-2">{t('clientProposals.coverLetter')}</h4>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedProposal.coverLetter}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">{t('clientProposals.bidAmount')}</p>
                    <p className="font-semibold text-white text-lg">€{selectedProposal.bidAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{t('clientProposals.deliveryTime')}</p>
                    <p className="font-semibold text-white text-lg">{selectedProposal.deliveryTime}</p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDetailClose}>
              {t('common.close')}
            </Button>
            {selectedProposal?.status === 'pending' && (
              <>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    handleRejectProposal(selectedProposal.id);
                    onDetailClose();
                  }}
                >
                  {t('clientProposals.reject')}
                </Button>
                <Button
                  color="secondary"
                  onPress={() => {
                    handleAcceptProposal(selectedProposal);
                    onDetailClose();
                  }}
                  isLoading={processingPayment}
                >
                  {t('clientProposals.acceptPay')}
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rating Modal */}
      <Modal isOpen={isRatingOpen} onClose={onRatingClose}>
        <ModalContent>
          <ModalHeader>{t('clientProposals.rateFreelancer')}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-400 mb-2">{t('clientProposals.howWasExperience')}</p>
                <h3 className="font-semibold text-white text-lg">
                  {selectedProposal?.freelancerName}?
                </h3>
              </div>
              
              <RadioGroup
                label={t('clientProposals.rating')}
                value={rating}
                onValueChange={setRating}
                orientation="horizontal"
                className="justify-center"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <Radio key={value} value={value.toString()}>
                    <div className="flex items-center gap-1">
                      {[...Array(value)].map((_, i) => (
                        <Icon key={i} icon="lucide:star" className="text-yellow-400" />
                      ))}
                    </div>
                  </Radio>
                ))}
              </RadioGroup>
              
              <Textarea
                label={t('clientProposals.reviewOptional')}
                placeholder={t('clientProposals.shareExperience')}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                minRows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onRatingClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              color="primary" 
              onPress={handleSubmitRating}
              isDisabled={!rating}
            >
              {t('clientProposals.submitReview')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};