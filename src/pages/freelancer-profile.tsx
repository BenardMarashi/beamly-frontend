import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Avatar, Chip, Image, Spinner } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { formatNameWithInitial } from '../utils/nameFormatter';


interface FreelancerData {
  id: string;
  displayName: string;
  bio: string;
  photoURL: string;
  hourlyRate: number;
  rating: number;
  ratingCount: number;
  completedProjects: number;
  skills: string[];
  experience: string;
  experienceLevel: string;
  languages: string[];
  isVerified: boolean;
  isAvailable: boolean;
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
  category: string;
  liveUrl?: string;
}

interface Review {
  id: string;
  clientId: string;
  clientName: string;
  clientPhotoURL: string;
  rating: number;
  text?: string;
  content?: string;
  comment: string;
  review?: string;
  message?: string;
  projectId?: string;
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
  const { user } = useAuth();
  
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [freelancerIsPro, setFreelancerIsPro] = useState(false);
  
  console.log('FreelancerProfilePage loaded with ID:', id);

  useEffect(() => {
    if (!id) {
      console.error('FreelancerProfilePage: No ID provided');
      toast.error(t('freelancerProfile.errors.invalidProfile'));
      navigate('/browse-freelancers');
      return;
    }
    
    fetchFreelancerData();
  }, [id, navigate]);

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
          displayName: userData.displayName || t('common.anonymous'),
          bio: userData.bio || t('freelancerProfile.noBio'),
          photoURL: userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'User'}&background=FCE90D&color=011241`,
          hourlyRate: userData.hourlyRate || 0,
          rating: userData.rating || 0,
          ratingCount: userData.ratingCount || 0,
          completedProjects: userData.completedProjects || 0,
          skills: userData.skills || [],
          experience: userData.experience || '',
          experienceLevel: userData.experienceLevel || 'intermediate',
          languages: userData.languages || ['English'],
          isVerified: userData.isVerified || false,
          isAvailable: userData.isAvailable ?? true,
          joinedAt: userData.createdAt,
          lastActive: userData.lastActive || userData.updatedAt || new Date()
        });
        setFreelancerIsPro(userData.isPro === true);
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

        // Fetch reviews for this freelancer
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('freelancerId', '==', id),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Review data:', data);
          return {
            id: doc.id,
            ...data,
            comment: data.comment || data.text || data.content || data.message || data.review || ''
          } as Review;
        });
        setReviews(reviewsData);
        
      } else {
        toast.error(t('freelancerProfile.errors.notFound'));
        navigate('/browse-freelancers');
      }
    } catch (error) {
      console.error('Error fetching freelancer data:', error);
      toast.error(t('freelancerProfile.errors.loadFailed'));
      navigate('/browse-freelancers');
    } finally {
      setLoading(false);
    }
  };

  const formatJoinDate = (date: any) => {
    if (!date) return t('freelancerProfile.recentlyJoined');
    const joinDate = date.toDate ? date.toDate() : new Date(date);
    return joinDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const formatLastActive = (date: any) => {
    if (!date) return t('freelancerProfile.recentlyActive');
    const lastActive = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('freelancerProfile.activeNow');
    if (diffInHours < 24) return t('freelancerProfile.hoursAgo', { hours: diffInHours });
    if (diffInHours < 48) return t('freelancerProfile.yesterday');
    return t('freelancerProfile.daysAgo', { days: Math.floor(diffInHours / 24) });
  };

  const formatReviewDate = (date: any) => {
    if (!date) return t('common.recently');
    const reviewDate = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return t('common.today');
    if (diffInDays === 1) return t('common.yesterday');
    if (diffInDays < 7) return t('common.daysAgo', { days: diffInDays });
    if (diffInDays < 30) return t('common.weeksAgo', { weeks: Math.floor(diffInDays / 7) });
    if (diffInDays < 365) return t('common.monthsAgo', { months: Math.floor(diffInDays / 30) });
    return t('common.yearsAgo', { years: Math.floor(diffInDays / 365) });
  };

  const getExperienceLevelLabel = (level: string) => {
    switch (level) {
      case 'entry':
        return t('freelancerProfile.experienceLevels.entry');
      case 'intermediate':
        return t('freelancerProfile.experienceLevels.intermediate');
      case 'expert':
        return t('freelancerProfile.experienceLevels.expert');
      default:
        return t('freelancerProfile.experienceLevels.freelancer');
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

  if (!freelancer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass-effect">
          <CardBody className="text-center p-8">
            <h2 className="text-xl font-semibold text-white mb-4">{t('freelancerProfile.notFound')}</h2>
            <Button 
              color="secondary" 
              onPress={() => navigate('/browse-freelancers')}
            >
              {t('freelancerProfile.browseFreelancers')}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="md:w-1/3">
          <div className="glass-effect p-6 rounded-xl md:sticky md:top-24">
            <div className="flex flex-col items-center text-center">
              <Avatar
                src={freelancer.photoURL}
                className="w-24 h-24 mb-4"
              />
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{user?.uid === id ? freelancer.displayName : formatNameWithInitial(freelancer.displayName)}</h1>
                {freelancer.isVerified && (
                  <Icon icon="lucide:badge-check" className="text-blue-400 w-5 h-5" />
                )}
              </div>
              <p className="text-beamly-secondary font-medium mb-2">
                {getExperienceLevelLabel(freelancer.experienceLevel)}
              </p>
              {freelancer.isAvailable ? (
                <Chip color="success" size="sm" className="mb-4">{t('freelancerProfile.available')}</Chip>
              ) : (
                <Chip color="default" size="sm" className="mb-4">{t('freelancerProfile.notAvailable')}</Chip>
              )}
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
                  {freelancer.rating.toFixed(1)}
                </span>
              </div>
              
              <div className="w-full border-t border-white/10 pt-4 mt-2">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.memberSince')}:</span>
                  <span className="text-white">{formatJoinDate(freelancer.joinedAt)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.lastActive')}:</span>
                  <span className="text-white">{formatLastActive(freelancer.lastActive)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.hourlyRate')}:</span>
                  <span className="text-beamly-secondary font-bold">
                    €{freelancer.hourlyRate}/hr
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.completed')}:</span>
                  <span className="text-white">{freelancer.completedProjects} {t('freelancerProfile.projects')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.languages')}:</span>
                  <span className="text-white">{freelancer.languages.join(', ')}</span>
                </div>
              </div>
              
            {/* Only show Send Message button if the FREELANCER is Pro or user viewing own profile */}
              <div className="w-full mt-6 space-y-3">
                <Button 
                  variant="bordered" 
                  className="w-full text-white border-white/30"
                  startContent={<Icon icon="lucide:mail" />}
                  onPress={() => navigate(`/messages?user=${freelancer.id}`)}
                  isDisabled={user?.uid === id}
                >
                  {t('freelancerProfile.sendMessage')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-2/3">
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.aboutMe')}</h2>
            <p className="text-gray-300 whitespace-pre-wrap">
              {freelancer.bio}
            </p>
          </div>
          
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.skills')}</h2>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills.length > 0 ? freelancer.skills.map((skill) => (
                <Chip 
                  key={skill}
                  className="bg-white/10 text-white"
                >
                  {skill}
                </Chip>
              )) : (
                <p className="text-gray-400">{t('freelancerProfile.noSkills')}</p>
              )}
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{t('freelancerProfile.portfolio')}</h2>
              {user?.uid === id && (
                <Button
                  color="secondary"
                  size="sm"
                  startContent={<Icon icon="lucide:plus" />}
                  onPress={() => navigate('/post-project')}
                >
                  {t('freelancerProfile.addProject')}
                </Button>
              )}
            </div>
            
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card 
                    key={project.id}
                    isPressable
                    onPress={() => navigate(`/projects/${project.id}`)}
                    className="glass-card hover:scale-105 transition-transform cursor-pointer"
                  >
                    <CardBody className="p-0">
                      <div className="relative aspect-video overflow-hidden">
                        <img 
                          src={project.thumbnailUrl || project.images?.[0] || `/api/placeholder/400/300`}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                        {project.category && (
                          <Chip 
                            size="sm" 
                            className="absolute top-2 right-2 bg-black/60 text-white"
                          >
                            {project.category}
                          </Chip>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-white font-semibold mb-2 line-clamp-1">
                          {project.title}
                        </h4>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex gap-2">
                          {project.liveUrl && (
                            <Button 
                              size="sm" 
                              color="secondary"
                              variant="flat"
                              startContent={<Icon icon="lucide:external-link" className="w-3 h-3" />}
                              onPress={(e: any) => {
                                e.stopPropagation();
                                window.open(project.liveUrl, '_blank');
                              }}
                            >
                              {t('freelancerProfile.live')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Icon 
                  icon="lucide:folder-open" 
                  className="text-5xl text-gray-400 mx-auto mb-3"
                />
                <p className="text-gray-400">
                  {user?.uid === id 
                    ? t('freelancerProfile.noProjectsOwn')
                    : t('freelancerProfile.noProjects')}
                </p>
                {user?.uid === id && (
                  <Button
                    color="secondary"
                    variant="flat"
                    className="mt-4"
                    onPress={() => navigate('/post-project')}
                  >
                    {t('freelancerProfile.postFirstProject')}
                  </Button>
                )}
              </div>
            )}
            
            {projects.length >= 6 && (
              <div className="text-center mt-4">
                <Button
                  variant="light"
                  className="text-white"
                  onPress={() => navigate(`/freelancer/${id}/projects`)}
                >
                  {t('freelancerProfile.viewAllProjects')}
                </Button>
              </div>
            )}
          </div>
          
          {freelancer.experience && (
            <div className="glass-effect p-6 rounded-xl mb-6">
              <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.professionalExperience')}</h2>
              <p className="text-gray-300 whitespace-pre-wrap">
                {freelancer.experience}
              </p>
            </div>
          )}
          
          {reviews.length > 0 && (
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{t('freelancerProfile.reviews')}</h2>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon 
                        key={star} 
                        icon="lucide:star" 
                        className={`w-4 h-4 ${star <= freelancer.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <span className="text-white font-semibold">
                    {freelancer.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({freelancer.ratingCount} {freelancer.ratingCount === 1 ? t('freelancerProfile.review') : t('freelancerProfile.reviews')})
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-white/10 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={review.clientPhotoURL || `https://ui-avatars.com/api/?name=${review.clientName}&background=FCE90D&color=011241`}
                          className="w-10 h-10"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{review.clientName}</h3>
                            <span className="text-gray-400 text-sm">•</span>
                            <span className="text-gray-400 text-sm">{formatReviewDate(review.createdAt)}</span>
                          </div>
                          <div className="flex mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Icon 
                                key={star} 
                                icon="lucide:star" 
                                className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {review.comment || review.text || review.content || review.message || review.review || 
                            <span className="italic text-gray-500">{t('freelancerProfile.noComment')}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {freelancer.ratingCount > reviews.length && (
                <div className="mt-4 text-center">
                  <Button
                    variant="light"
                    className="text-beamly-secondary"
                    onPress={() => navigate(`/freelancer/${id}/reviews`)}
                  >
                    {t('freelancerProfile.viewAllReviews', { count: freelancer.ratingCount })}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfilePage;