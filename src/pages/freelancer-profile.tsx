import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Avatar, Chip, Image, Spinner } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";

interface FreelancerData {
  id: string;
  displayName: string;
  bio: string;
  location: string;
  photoURL: string;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  skills: string[];
  experience: string;
  isVerified: boolean;
  joinedAt: any;
  lastActive: any;
}

interface Project {
  id: string;
  title: string;
  description: string;
  images: string[];
  thumbnailUrl: string;
  skills: string[];
  liveUrl?: string;
  githubUrl?: string;
}

interface Review {
  id: string;
  clientName: string;
  clientPhotoURL: string;
  rating: number;
  comment: string;
  createdAt: any;
}

interface FreelancerProfilePageProps {
  setCurrentPage?: (page: string) => void;
  isDarkMode?: boolean;
}

export const FreelancerProfilePage: React.FC<FreelancerProfilePageProps> = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  console.log('FreelancerProfilePage loaded with ID:', id);

  useEffect(() => {
    if (id) {
      fetchFreelancerData();
    }
  }, [id]);

  const fetchFreelancerData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch freelancer profile
      const userDoc = await getDoc(doc(db, 'users', id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFreelancer({
          id: userDoc.id,
          displayName: userData.displayName || 'Anonymous',
          bio: userData.bio || 'No bio available',
          location: userData.location || 'Location not specified',
          photoURL: userData.photoURL || `https://i.pravatar.cc/150?u=${id}`,
          hourlyRate: userData.hourlyRate || 0,
          rating: userData.rating || 0,
          reviewCount: userData.reviewCount || 0,
          completedProjects: userData.completedProjects || 0,
          skills: userData.skills || [],
          experience: userData.experience || 'Experience not specified',
          isVerified: userData.isVerified || false,
          joinedAt: userData.createdAt,
          lastActive: userData.lastActive
        });

        // Fetch freelancer's projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('freelancerId', '==', id),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project));
        setProjects(projectsData);

        // Fetch reviews (would need to be implemented in your schema)
        // For now using mock data as reviews system might not be fully implemented
        setReviews([]);
        
      } else {
        toast.error('Freelancer not found');
        navigate('/browse-freelancers');
      }
    } catch (error) {
      console.error('Error fetching freelancer data:', error);
      toast.error('Failed to load freelancer profile');
    } finally {
      setLoading(false);
    }
  };

  const formatJoinDate = (date: any) => {
    if (!date) return 'Recently joined';
    const joinDate = date.toDate ? date.toDate() : new Date(date);
    return joinDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const formatLastActive = (date: any) => {
    if (!date) return 'Recently active';
    const lastActive = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)} days ago`;
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

  if (!freelancer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass-effect">
          <CardBody className="text-center p-8">
            <h2 className="text-xl font-semibold text-white mb-4">Freelancer not found</h2>
            <Button 
              color="secondary" 
              onPress={() => navigate('/browse-freelancers')}
            >
              Browse Freelancers
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="glass-effect p-6 rounded-xl sticky top-24">
            <div className="flex flex-col items-center text-center">
              <Avatar
                src={freelancer.photoURL}
                className="w-24 h-24 mb-4"
              />
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{freelancer.displayName}</h1>
                {freelancer.isVerified && (
                  <Icon icon="lucide:badge-check" className="text-blue-400 w-5 h-5" />
                )}
              </div>
              <p className="text-beamly-secondary font-medium mb-2">
                {freelancer.experience || 'Freelancer'}
              </p>
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon 
                      key={star} 
                      icon="lucide:star" 
                      className={`w-4 h-4 ${star <= freelancer.rating ? 'text-yellow-400' : 'text-gray-600'}`} 
                    />
                  ))}
                </div>
                <span className="text-gray-300 text-sm ml-2">
                  {freelancer.rating.toFixed(1)} ({freelancer.reviewCount} reviews)
                </span>
              </div>
              
              <div className="w-full border-t border-white/10 pt-4 mt-2">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Location:</span>
                  <span className="text-white">{freelancer.location}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Member Since:</span>
                  <span className="text-white">{formatJoinDate(freelancer.joinedAt)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Last Active:</span>
                  <span className="text-white">{formatLastActive(freelancer.lastActive)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Hourly Rate:</span>
                  <span className="text-beamly-secondary font-bold">
                    ${freelancer.hourlyRate}/hr
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Projects:</span>
                  <span className="text-white">{freelancer.completedProjects}</span>
                </div>
              </div>
              
              <div className="w-full mt-6 space-y-3">
                <Button 
                  color="secondary" 
                  className="w-full font-medium text-beamly-third"
                  onPress={() => {
                    console.log("Hire me button clicked");
                    // No navigation, just a log
                  }}
                >
                  Hire Me
                </Button>
                <Button 
                  variant="bordered" 
                  className="w-full text-white border-white/30"
                  startContent={<Icon icon="lucide:mail" />}
                  onPress={() => navigate(`/chat?user=${freelancer.id}`)}
                >
                  Send Message
                </Button>
                <Button 
                  variant="light" 
                  className="w-full text-white"
                  startContent={<Icon icon="lucide:bookmark" />}
                  onPress={() => {
                    console.log("Save profile button clicked");
                    // No navigation, just a log
                  }}
                >
                  Save Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-2/3">
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">About Me</h2>
            <p className="text-gray-300">
              {freelancer.bio}
            </p>
          </div>
          
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills.length > 0 ? freelancer.skills.map((skill) => (
                <Chip 
                  key={skill}
                  className="bg-white/10 text-white"
                >
                  {skill}
                </Chip>
              )) : (
                <p className="text-gray-400">No skills listed</p>
              )}
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Portfolio</h2>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="relative overflow-hidden rounded-lg group">
                    <img 
                      src={project.thumbnailUrl || project.images?.[0] || `https://img.heroui.chat/image/dashboard?w=400&h=300&u=${project.id}`}
                      alt={project.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-center">
                        <h4 className="text-white font-medium mb-2">{project.title}</h4>
                        <div className="flex gap-2">
                          {project.liveUrl && (
                            <Button 
                              size="sm" 
                              color="secondary"
                              className="font-medium text-beamly-third"
                              onPress={() => window.open(project.liveUrl, '_blank')}
                            >
                              View Live
                            </Button>
                          )}
                          {project.githubUrl && (
                            <Button 
                              size="sm" 
                              variant="bordered"
                              className="text-white border-white"
                              onPress={() => window.open(project.githubUrl, '_blank')}
                            >
                              Code
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No projects to display</p>
            )}
          </div>
          
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Experience</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between">
                  <h3 className="font-semibold text-white">Senior UI/UX Designer</h3>
                  <span className="text-beamly-secondary">2020 - Present</span>
                </div>
                <p className="text-gray-400">Designify Agency</p>
                <p className="text-gray-300 mt-2">
                  Led the design team in creating user-centered digital products for various clients. Conducted user research, created wireframes, prototypes, and final designs.
                </p>
              </div>
              <div>
                <div className="flex justify-between">
                  <h3 className="font-semibold text-white">UI/UX Designer</h3>
                  <span className="text-beamly-secondary">2018 - 2020</span>
                </div>
                <p className="text-gray-400">TechCorp Inc.</p>
                <p className="text-gray-300 mt-2">
                  Designed user interfaces for web and mobile applications. Collaborated with developers to ensure proper implementation of designs.
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Reviews</h2>
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon key={star} icon="lucide:star" className="text-yellow-400 w-4 h-4" />
                  ))}
                </div>
                <span className="text-gray-300 text-sm ml-2">5.0 (48 reviews)</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {[1, 2, 3].map((review) => (
                <div key={review} className="border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Avatar
                        src={`https://img.heroui.chat/image/avatar?w=100&h=100&u=client${review}`}
                        className="w-10 h-10 mr-3"
                      />
                      <div>
                        <h3 className="font-semibold text-white">Client Name</h3>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Icon key={star} icon="lucide:star" className="text-yellow-400 w-3 h-3" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">2 weeks ago</span>
                  </div>
                  <p className="text-gray-300 mt-2">
                    John did an amazing job on our project. He was very professional, responsive, and delivered high-quality work on time. Would definitely work with him again!
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                variant="light" 
                className="text-white"
                onPress={() => {
                  console.log("See more reviews button clicked");
                  // No navigation, just a log
                }}
              >
                See More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfilePage;