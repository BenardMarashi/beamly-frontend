import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { fns } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Textarea, Select, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';

interface JobFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  skills: string[];
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax: number;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  projectSize: 'small' | 'medium' | 'large';
  duration: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  location?: string;
}

export const PostJobForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    skills: [],
    budgetType: 'fixed',
    budgetMin: 0,
    budgetMax: 0,
    experienceLevel: 'intermediate',
    projectSize: 'medium',
    duration: '1-3 months',
    locationType: 'remote'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const createJob = httpsCallable(fns, 'createJob');
      const result = await createJob(formData);
      
      if (result.data.success) {
        toast.success('Job posted successfully!');
        navigate(`/jobs/${result.data.jobId}`);
      }
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Job Title"
        placeholder="e.g., Full-Stack Developer for E-commerce Platform"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <Textarea
        label="Job Description"
        placeholder="Describe the project, requirements, and deliverables..."
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        minRows={5}
        required
      />

      <Select
        label="Category"
        placeholder="Select a category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        required
      >
        <SelectItem key="development" value="development">Development</SelectItem>
        <SelectItem key="design" value="design">Design</SelectItem>
        <SelectItem key="marketing" value="marketing">Marketing</SelectItem>
        <SelectItem key="writing" value="writing">Writing</SelectItem>
        <SelectItem key="video" value="video">Video & Animation</SelectItem>
      </Select>

      {/* Add more form fields for skills, budget, etc. */}

      <Button
        type="submit"
        color="primary"
        isLoading={loading}
        className="w-full"
      >
        Post Job
      </Button>
    </form>
  );
};