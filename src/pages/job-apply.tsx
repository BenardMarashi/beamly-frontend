import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Spinner,
  Chip
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ProposalService } from '../services/firebase-services';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: string;
  skills: string[];
  experienceLevel: string;
  status: string;
}

export const JobApplyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userData, isFreelancer } = useAuth();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedAmount: 0,
    timeline: '',
    experience: ''
  });

  useEffect(() => {
    if (!user) {
      toast.error('Please login to apply for jobs');
      navigate('/login');
      return;
    }
    
    if (!isFreelancer) {
      toast.error('Only freelancers can apply for jobs');
      navigate('/browse-freelancers');
      return;
    }

    if (id) {
      fetchJob();
    }
  }, [id, user, isFreelancer]);

  const fetchJob = async () => {
    if (!id) return;
    
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', id));
      if (jobDoc.exists()) {
        const jobData = { id: jobDoc.id, ...jobDoc.data() } as Job;
        
        if (jobData.status !== 'open') {
          toast.error('This job is no longer accepting applications');
          navigate('/looking-for-work');
          return;
        }
        
        setJob(jobData);
        setFormData(prev => ({
          ...prev,
          proposedAmount: jobData.budgetType === 'fixed' ? jobData.budgetMin : jobData.budgetMin
        }));
      } else {
        toast.error('Job not found');
        navigate('/looking-for-work');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job || !user) return;
    
    if (!formData.coverLetter.trim()) {
      toast.error('Please write a cover letter');
      return;
    }
    
    if (formData.proposedAmount <= 0) {
      toast.error('Please enter a valid proposed amount');
      return;
    }
    
    if (!formData.timeline.trim()) {
      toast.error('Please provide a timeline');
      return;
    }

    setSubmitting(true);
    
    try {
      await ProposalService.createProposal({
        jobId: job.id,
        freelancerId: user.uid,
        freelancerName: userData?.displayName || 'Anonymous',
        freelancerPhotoURL: userData?.photoURL || '',
        clientId: job.clientId,
        coverLetter: formData.coverLetter,
        proposedRate: formData.proposedAmount,
        estimatedDuration: formData.timeline,
        budgetType: 'fixed', // Default to fixed budget type
        status: 'pending'
      });
      
      toast.success('Application submitted successfully!');
      navigate('/proposals');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass-effect">
          <CardBody className="text-center p-8">
            <h2 className="text-xl font-semibold text-white mb-4">Job not found</h2>
            <Button color="secondary" onPress={() => navigate('/looking-for-work')}>
              Browse Jobs
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-6">
          <Button
            variant="light"
            startContent={<Icon icon="lucide:arrow-left" />}
            onPress={() => navigate(`/job/${job.id}`)}
            className="text-white mb-4"
          >
            Back to Job Details
          </Button>
          <h1 className="text-2xl font-bold text-white mb-2">Apply for Job</h1>
          <h2 className="text-xl text-beamly-secondary">{job.title}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Summary */}
          <Card className="glass-effect border-none lg:col-span-1">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Job Summary</h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Client:</span>
                  <p className="text-white">{job.clientName}</p>
                </div>
                
                <div>
                  <span className="text-gray-400 text-sm">Budget:</span>
                  <p className="text-beamly-secondary font-semibold">
                    ${job.budgetMin}
                    {job.budgetType === 'hourly' && job.budgetMax > job.budgetMin 
                      ? ` - $${job.budgetMax} /hr` 
                      : job.budgetType === 'hourly' 
                      ? ' /hr' 
                      : ''}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-400 text-sm">Experience Level:</span>
                  <p className="text-white capitalize">{job.experienceLevel}</p>
                </div>
                
                <div>
                  <span className="text-gray-400 text-sm">Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.skills.map((skill, index) => (
                      <Chip key={index} size="sm" className="bg-white/10 text-white">
                        {skill}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Application Form */}
          <Card className="glass-effect border-none lg:col-span-2">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Your Application</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <Textarea
                  label="Cover Letter"
                  placeholder="Tell the client why you're the perfect fit for this job..."
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  minRows={6}
                  variant="bordered"
                  className="text-white"
                  isRequired
                />
                
                <Input
                  type="number"
                  label={`Proposed Amount ${job.budgetType === 'hourly' ? '(per hour)' : '(total)'}`}
                  placeholder="Enter your rate"
                  value={formData.proposedAmount.toString()}
                  onChange={(e) => setFormData({ ...formData, proposedAmount: Number(e.target.value) })}
                  startContent={<span className="text-gray-400">$</span>}
                  variant="bordered"
                  className="text-white"
                  isRequired
                />
                
                <Input
                  label="Timeline"
                  placeholder="How long will this project take?"
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  isRequired
                />
                
                <Textarea
                  label="Relevant Experience"
                  placeholder="Describe your experience with similar projects..."
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  minRows={4}
                  variant="bordered"
                  className="text-white"
                />
                
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    color="secondary"
                    className="flex-1 font-medium text-beamly-third"
                    isLoading={submitting}
                    disabled={submitting}
                  >
                    Submit Application
                  </Button>
                  <Button
                    variant="bordered"
                    className="text-white border-white/30"
                    onPress={() => navigate(`/job/${job.id}`)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default JobApplyPage;