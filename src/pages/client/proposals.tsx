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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { StripeService } from '../../services/stripe-service';

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
  deliveryTime?: string;
  estimatedDuration?: string; // This might be the actual field
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  projectStatus?: 'ongoing' | 'completed';
  createdAt: any;
  updatedAt?: any;
}

interface Job {
  id: string;
  title: string;
  clientId: string;
}

export const ClientProposalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
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
              freelancerName: freelancerData?.displayName || 'Unknown',
              freelancerAvatar: freelancerData?.photoURL,
              freelancerRating: freelancerData?.rating || 0
            } as Proposal);
          } catch (error) {
            console.error('Error fetching freelancer data:', error);
            // Still add the proposal even if freelancer data fails
            proposalsData.push({
              id: docSnapshot.id,
              ...data,
              freelancerName: data.freelancerName || 'Unknown',
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

const handleAcceptProposal = async (proposal: Proposal) => {
  // Validate minimum amount (Stripe minimum is usually $0.50)
  if (!proposal.bidAmount || proposal.bidAmount < 0.50) {
    toast.error('Bid amount must be at least $0.50');
    return;
  }
  
  setSelectedProposal(proposal);
  setProcessingPayment(true);
  
  try {
    // Create Stripe checkout for project payment
    const result = await StripeService.createProjectPayment({
      clientId: user!.uid,
      freelancerId: proposal.freelancerId,
      proposalId: proposal.id,
      jobId: proposal.jobId,
      amount: proposal.bidAmount,
      description: `Payment for: ${proposal.jobTitle}`
    });
    
    if (result.success && result.checkoutUrl) {
      // Update proposal status to accepted
      await updateDoc(doc(db, 'proposals', proposal.id), {
        status: 'accepted',
        projectStatus: 'ongoing',
        acceptedAt: new Date()
      });
      
      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl;
    } else {
      toast.error('Failed to create payment session');
    }
  } catch (error) {
    console.error('Error accepting proposal:', error);
    toast.error('Failed to process payment');
  } finally {
    setProcessingPayment(false);
  }
};

  const handleRejectProposal = async (proposalId: string) => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) return;

    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        status: 'rejected',
        rejectedAt: new Date()
      });
      toast.success('Proposal rejected');
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Failed to reject proposal');
    }
  };

  const handleCompleteProject = async (proposalId: string) => {
    if (!window.confirm('Mark this project as completed? You will be able to rate the freelancer.')) return;

    try {
      await updateDoc(doc(db, 'proposals', proposalId), {
        projectStatus: 'completed',
        completedAt: new Date()
      });
      
      // Open rating modal
      const proposal = proposals.find(p => p.id === proposalId);
      if (proposal) {
        setSelectedProposal(proposal);
        onRatingOpen();
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error('Failed to complete project');
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedProposal || !rating) return;

    try {
      // Add review
      await addDoc(collection(db, 'reviews'), {
        freelancerId: selectedProposal.freelancerId,
        clientId: user!.uid,
        clientName: userData?.displayName || 'Client',
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

      toast.success('Review submitted successfully');
      onRatingClose();
      setRating('');
      setReview('');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
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
        <h1 className="text-3xl font-bold text-white mb-2">Proposals Received</h1>
        <p className="text-gray-400">Review and manage proposals from freelancers</p>
      </div>

      {/* Job Filter */}
      <div className="mb-6">
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2"
        >
          <option value="all">All Jobs</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>{job.title}</option>
          ))}
        </select>
      </div>

      {filteredProposals.length === 0 ? (
        <Card className="glass-effect">
          <CardBody className="text-center py-12">
            <Icon icon="lucide:inbox" className="text-6xl text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No proposals yet</h3>
            <p className="text-gray-400 mb-6">
              {selectedJob === 'all' 
                ? "You haven't received any proposals for your jobs"
                : "No proposals for this job yet"}
            </p>
            <Button 
              color="secondary"
              onPress={() => navigate('/post-job')}
              startContent={<Icon icon="lucide:plus" />}
            >
              Post a Job
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
                          For: {proposal.jobTitle}
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
                          proposal.status === 'accepted' && proposal.projectStatus === 'ongoing' ? 'primary' :
                          proposal.status === 'accepted' && proposal.projectStatus === 'completed' ? 'success' :
                          proposal.status === 'pending' ? 'warning' :
                          proposal.status === 'rejected' ? 'danger' : 'default'
                        }
                        variant="flat"
                      >
                        {proposal.status === 'accepted' && proposal.projectStatus === 'ongoing' ? 'In Progress' :
                         proposal.status === 'accepted' && proposal.projectStatus === 'completed' ? 'Completed' :
                         proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </Chip>
                    </div>
                    
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-400">Bid Amount:</p>
                      <p className="font-semibold text-white">${proposal.bidAmount || proposal.proposedRate || 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-400">Delivery:</p>
                      <p className="text-white">{proposal.deliveryTime || proposal.estimatedDuration || 'Not specified'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-400">Submitted:</p>
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
                        View Details
                      </Button>
                      
                      {proposal.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            color="secondary"
                            onPress={() => handleAcceptProposal(proposal)}
                            isLoading={processingPayment}
                          >
                            Accept & Pay
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => handleRejectProposal(proposal.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {proposal.status === 'accepted' && proposal.projectStatus === 'ongoing' && (
                        <Button
                          size="sm"
                          color="success"
                          onPress={() => handleCompleteProject(proposal.id)}
                        >
                          Mark as Complete
                        </Button>
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
                          Rate Freelancer
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
          <ModalHeader>Proposal Details</ModalHeader>
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
                    <p className="text-sm text-gray-400">For: {selectedProposal.jobTitle}</p>
                  </div>
                </div>
                
                <Divider />
                
                <div>
                  <h4 className="font-semibold text-white mb-2">Cover Letter</h4>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedProposal.coverLetter}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Bid Amount</p>
                    <p className="font-semibold text-white text-lg">${selectedProposal.bidAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Delivery Time</p>
                    <p className="font-semibold text-white text-lg">{selectedProposal.deliveryTime}</p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDetailClose}>
              Close
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
                  Reject
                </Button>
                <Button
                  color="secondary"
                  onPress={() => {
                    handleAcceptProposal(selectedProposal);
                    onDetailClose();
                  }}
                  isLoading={processingPayment}
                >
                  Accept & Pay
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rating Modal */}
      <Modal isOpen={isRatingOpen} onClose={onRatingClose}>
        <ModalContent>
          <ModalHeader>Rate Freelancer</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-400 mb-2">How was your experience with</p>
                <h3 className="font-semibold text-white text-lg">
                  {selectedProposal?.freelancerName}?
                </h3>
              </div>
              
              <RadioGroup
                label="Rating"
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
                label="Review (Optional)"
                placeholder="Share your experience..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                minRows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onRatingClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSubmitRating}
              isDisabled={!rating}
            >
              Submit Review
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};