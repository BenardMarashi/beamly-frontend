// src/pages/jobs/ApplyJobPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { db, fns } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button,
  Card,
  CardBody,
  Textarea,
  Input,
  Chip
} from '@nextui-org/react';
import { toast } from 'react-hot-toast';
import { Icon } from '@iconify/react';

export const ApplyJobPage: React.FC = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedRate: 0,
    rateType: 'fixed',
    estimatedDuration: '',
    attachments: []
  });

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;
    
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (jobDoc.exists()) {
        setJob({ id: jobDoc.id, ...jobDoc.data() });
        setFormData(prev => ({
          ...prev,
          rateType: jobDoc.data().budgetType
        }));
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitProposal = httpsCallable(fns, 'submitProposal');
      const result = await submitProposal({
        jobId,
        ...formData
      });
      
      if ((result.data as any).success) {
        toast.success('Proposal submitted successfully!');
        navigate(`/proposals/${(result.data as any).proposalId}`);
      }
    } catch (error: any) {
      console.error('Error submitting proposal:', error);
      toast.error(error.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  if (!job) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Job Summary */}
      <Card className="glass-card mb-6">
        <CardBody className="p-6">
          <h1 className="text-2xl font-bold text-white mb-4">{job.title}</h1>
          <div className="flex items-center gap-4 text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <Icon icon="lucide:briefcase" />
              {job.category}
            </span>
            <span className="flex items-center gap-1">
              <Icon icon="lucide:clock" />
              {job.duration}
            </span>
            <span className="flex items-center gap-1">
              <Icon icon="lucide:dollar-sign" />
              {job.budgetType === 'fixed' ? 
                `$${job.fixedPrice}` : 
                `$${job.budgetMin}-${job.budgetMax}/hr`
              }
            </span>
          </div>
          <p className="text-gray-300 mb-4">{job.description}</p>
          <div className="flex flex-wrap gap-2">
            {job.skills?.map((skill: string) => (
              <Chip key={skill} size="sm" variant="flat">
                {skill}
              </Chip>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Application Form */}
      <Card className="glass-card">
        <CardBody className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Submit Your Proposal</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Textarea
              label="Cover Letter"
              placeholder="Explain why you're the best fit for this job..."
              value={formData.coverLetter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setFormData({ ...formData, coverLetter: e.target.value })
              }
              minRows={6}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label={job.budgetType === 'fixed' ? 'Your Bid' : 'Hourly Rate'}
                placeholder="Enter amount"
                value={formData.proposedRate.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, proposedRate: parseInt(e.target.value) || 0 })
                }
                startContent={<span className="text-gray-400">$</span>}
                required
              />
              
              <Input
                label="Estimated Duration"
                placeholder="e.g., 2 weeks"
                value={formData.estimatedDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData({ ...formData, estimatedDuration: e.target.value })
                }
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="flat"
                onClick={() => navigate(`/jobs/${jobId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={loading}
              >
                Submit Proposal
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};