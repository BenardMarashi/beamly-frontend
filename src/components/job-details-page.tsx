import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardBody, Button, Chip, Avatar, Skeleton, Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { PageHeader } from "./page-header";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

interface JobDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax?: number;
  skills: string[];
  experienceLevel: string;
  projectDuration: string;
  attachments?: string[];
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientRating?: number;
  clientJobsPosted?: number;
  clientCountry?: string;
  postedAt: any;
  proposals: number;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
}

interface JobDetailsPageProps {
  isDarkMode?: boolean;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const isFreelancer = userData?.userType === 'freelancer' || userData?.userType === 'both';

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', id));
      if (jobDoc.exists()) {
        setJob({ id: jobDoc.id, ...jobDoc.data() } as JobDetails);
      } else {
        toast.error('Job not found');
        navigate('/looking-for-work');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!user) {
      toast.error('Please login to apply');
      navigate('/login');
      return;
    }
    
    if (!isFreelancer) {
      toast.error('Only freelancers can apply to jobs');
      return;
    }
    
    navigate(`/jobs/${id}/apply`);
  };

  const formatBudget = () => {
    if (!job) return '';
    
    if (job.budgetType === 'fixed') {
      return `$${job.budgetMin}`;
    } else {
      return `$${job.budgetMin} - $${job.budgetMax}/hr`;
    }
  };

  const formatPostedDate = (date: any) => {
    if (!date) return 'Recently';
    const postedDate = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <PageHeader 
          title="Loading..."
          subtitle="Please wait while we fetch the job details"
        />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardBody className="space-y-4">
                  <Skeleton className="h-8 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-2/3 rounded-lg" />
                </CardBody>
              </Card>
            </div>
            <div>
              <Card className="glass-effect">
                <CardBody className="space-y-4">
                  <Skeleton className="h-6 w-1/2 rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <PageHeader 
          title="Job Not Found"
          subtitle="The job you're looking for doesn't exist or has been removed"
        />
        <div className="container mx-auto px-4 py-8 text-center">
          <Button 
            color="secondary"
            onPress={() => navigate('/looking-for-work')}
          >
            Browse Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs className="mb-6">
          <BreadcrumbItem onPress={() => navigate('/')}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate('/looking-for-work')}>Jobs</BreadcrumbItem>
          <BreadcrumbItem>{job.title}</BreadcrumbItem>
        </Breadcrumbs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="glass-effect">
              <CardBody className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">{job.title}</h1>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <Chip color="secondary" variant="flat">
                    <Icon icon="lucide:folder" className="mr-1" />
                    {job.category}
                  </Chip>
                  <Chip variant="flat">
                    <Icon icon="lucide:clock" className="mr-1" />
                    {formatPostedDate(job.postedAt)}
                  </Chip>
                  <Chip variant="flat">
                    <Icon icon="lucide:map-pin" className="mr-1" />
                    {job.clientCountry || 'Remote'}
                  </Chip>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
                    <p className="text-gray-300 whitespace-pre-wrap">{job.description}</p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-white mb-3">Skills Required</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Chip key={skill} variant="flat">{skill}</Chip>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-gray-400 mb-1">Experience Level</h3>
                      <p className="text-white capitalize">{job.experienceLevel}</p>
                    </div>
                    <div>
                      <h3 className="text-gray-400 mb-1">Project Duration</h3>
                      <p className="text-white">{job.projectDuration}</p>
                    </div>
                  </div>

                  {job.attachments && job.attachments.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-3">Attachments</h2>
                      <div className="space-y-2">
                        {job.attachments.map((_, index) => (
                          <div key={index} className="flex items-center gap-2 text-gray-300">
                            <Icon icon="lucide:paperclip" />
                            <span>Attachment {index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-effect">
              <CardBody className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-400 mb-2">Budget</p>
                  <p className="text-3xl font-bold text-white">{formatBudget()}</p>
                  <p className="text-sm text-gray-400 capitalize">{job.budgetType} Price</p>
                </div>

                {isFreelancer && (
                  <Button
                    color="secondary"
                    size="lg"
                    className="w-full mb-4"
                    onPress={handleApply}
                  >
                    Apply Now
                  </Button>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Proposals</span>
                    <span className="text-white">{job.proposals}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    <Chip
                      size="sm"
                      color={job.status === 'open' ? 'success' : 'default'}
                      variant="flat"
                    >
                      {job.status}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="glass-effect">
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">About the Client</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar
                    src={job.clientAvatar}
                    name={job.clientName}
                    size="lg"
                  />
                  <div>
                    <p className="text-white font-medium">{job.clientName}</p>
                    {job.clientRating && (
                      <div className="flex items-center gap-1">
                        <Icon icon="lucide:star" className="text-yellow-500" />
                        <span className="text-gray-400">{job.clientRating}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {job.clientJobsPosted && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Jobs Posted</span>
                      <span className="text-white">{job.clientJobsPosted}</span>
                    </div>
                  )}
                  {job.clientCountry && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Location</span>
                      <span className="text-white">{job.clientCountry}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};