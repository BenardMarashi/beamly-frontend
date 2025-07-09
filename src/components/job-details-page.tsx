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
  // FIXED: Removed unused setCurrentPage
  isDarkMode?: boolean;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = ({ 
  isDarkMode = true 
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isFreelancer } = useAuth();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  // FIXED: Removed unused applying and setApplying

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    if (!id) return;

    try {
      const jobDoc = await getDoc(doc(db, "jobs", id));
      
      if (jobDoc.exists()) {
        const data = jobDoc.data();
        setJob({
          id: jobDoc.id,
          ...data
        } as JobDetails);
      } else {
        toast.error("Job not found");
        navigate("/looking-for-work");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!user) {
      toast.error("Please login to apply for jobs");
      navigate("/login");
      return;
    }
    
    if (!isFreelancer) {
      toast.error("Only freelancers can apply for jobs");
      return;
    }
    
    navigate(`/submit-proposal/${id}`);
  };

  const formatBudget = () => {
    if (!job) return '';
    
    if (job.budgetType === 'fixed') {
      return `$${job.budgetMin}`;
    }
    return `$${job.budgetMin} - $${job.budgetMax}/hr`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <PageHeader title="Loading..." subtitle="" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardBody>
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardBody>
              </Card>
            </div>
            <div>
              <Card className="glass-effect">
                <CardBody>
                  <Skeleton className="h-32 w-full" />
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <PageHeader
        title={job.title}
        subtitle={`Posted ${job.postedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}`}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-6">
          <BreadcrumbItem onPress={() => navigate("/")}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => navigate("/looking-for-work")}>Jobs</BreadcrumbItem>
          <BreadcrumbItem>{job.category}</BreadcrumbItem>
          <BreadcrumbItem>{job.title}</BreadcrumbItem>
        </Breadcrumbs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-effect">
              <CardBody>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{job.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Icon icon="lucide:folder" />
                        {job.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="lucide:clock" />
                        Posted {job.postedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="lucide:users" />
                        {job.proposals} proposals
                      </span>
                    </div>
                  </div>
                  <Chip
                    color={job.status === 'open' ? 'success' : 'default'}
                    variant="flat"
                  >
                    {job.status}
                  </Chip>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <p className="text-gray-300 whitespace-pre-line">{job.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          variant="flat"
                          className="bg-white/10"
                        >
                          {skill}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-400 mb-1">Experience Level</h4>
                      <p className="text-white">{job.experienceLevel}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-400 mb-1">Project Duration</h4>
                      <p className="text-white">{job.projectDuration}</p>
                    </div>
                  </div>

                  {job.attachments && job.attachments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Attachments</h3>
                      <div className="space-y-2">
                        {job.attachments.map((attachment, index) => (
                          <Button
                            key={index}
                            variant="bordered"
                            size="sm"
                            startContent={<Icon icon="lucide:paperclip" />}
                          >
                            Attachment {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Action Buttons for Freelancers */}
            {isFreelancer && job.status === 'open' && (
              <Card className="glass-effect">
                <CardBody>
                  <div className="flex gap-4">
                    <Button
                      color="secondary"
                      size="lg"
                      className="flex-1"
                      onPress={handleApply}
                    >
                      Submit Proposal
                    </Button>
                    <Button
                      variant="bordered"
                      size="lg"
                      startContent={<Icon icon="lucide:heart" />}
                    >
                      Save Job
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget Card */}
            <Card className="glass-effect">
              <CardBody>
                <h3 className="font-semibold text-white mb-4">Budget</h3>
                <p className="text-3xl font-bold text-white mb-2">{formatBudget()}</p>
                <p className="text-sm text-gray-400">
                  {job.budgetType === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                </p>
              </CardBody>
            </Card>

            {/* Client Info Card */}
            <Card className="glass-effect">
              <CardBody>
                <h3 className="font-semibold text-white mb-4">About the Client</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={job.clientAvatar || `https://i.pravatar.cc/150?u=${job.clientId}`}
                      size="lg"
                    />
                    <div>
                      <p className="font-semibold text-white">{job.clientName}</p>
                      {job.clientRating && (
                        <div className="flex items-center gap-1">
                          <Icon icon="lucide:star" className="text-yellow-500 text-sm" />
                          <span className="text-sm text-white">{job.clientRating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {job.clientCountry && (
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:map-pin" className="text-gray-400" />
                        <span className="text-gray-300">{job.clientCountry}</span>
                      </div>
                    )}
                    {job.clientJobsPosted && (
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:briefcase" className="text-gray-400" />
                        <span className="text-gray-300">{job.clientJobsPosted} jobs posted</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="bordered"
                    className="w-full"
                    startContent={<Icon icon="lucide:message-square" />}
                  >
                    Contact Client
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Similar Jobs */}
            <Card className="glass-effect">
              <CardBody>
                <h3 className="font-semibold text-white mb-4">Similar Jobs</h3>
                <p className="text-sm text-gray-400">Coming soon...</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};