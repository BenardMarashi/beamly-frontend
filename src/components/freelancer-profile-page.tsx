import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Avatar, Chip, Image, Skeleton } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

export const FreelancerProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      fetchFreelancerProfile();
      fetchReviews();
    }
  }, [id]);
  
  const fetchFreelancerProfile = async () => {
    if (!id) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Only show profile if user is a freelancer or has "both" type
        if (data.userType === 'freelancer' || data.userType === 'both') {
          setProfileData(data);
        } else {
          toast.error("User is not a freelancer");
          navigate('/freelancers');
        }
      } else {
        toast.error("Freelancer not found");
        navigate('/freelancers');
      }
    } catch (error) {
      console.error("Error fetching freelancer profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchReviews = async () => {
    if (!id) return;
    
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("freelancerId", "==", id),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(reviewsQuery);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleHireFreelancer = () => {
    if (!user) {
      toast.error("Please login to hire freelancers");
      navigate('/login');
      return;
    }
    // Navigate to job posting with pre-selected freelancer
    navigate(`/jobs/new?freelancer=${id}`);
  };

  const handleSendMessage = () => {
    if (!user) {
      toast.error("Please login to send messages");
      navigate('/login');
      return;
    }
    navigate(`/messages/new?recipient=${id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <Card className="glass-effect">
              <CardBody className="p-6">
                <Skeleton className="rounded-full w-24 h-24 mx-auto mb-4" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-3 w-1/2 mx-auto" />
              </CardBody>
            </Card>
          </div>
          <div className="md:w-2/3 space-y-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const profilePicture = profileData.photoURL || 
    `https://ui-avatars.com/api/?name=${profileData.displayName}&background=0F43EE&color=fff`;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="light"
        startContent={<Icon icon="lucide:arrow-left" />}
        onPress={() => navigate(-1)}
        className="mb-4"
      >
        Back
      </Button>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="glass-effect p-6 rounded-xl sticky top-24">
            <div className="flex flex-col items-center text-center">
              <Avatar
                src={profilePicture}
                className="w-24 h-24 mb-4"
                name={profileData.displayName}
              />
              <h1 className="text-2xl font-bold text-white mb-1">
                {profileData.displayName}
              </h1>
              <p className="text-beamly-secondary font-medium mb-2">
                {profileData.skills?.[0] || 'Freelancer'}
              </p>
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon 
                      key={star} 
                      icon="lucide:star" 
                      className={star <= Math.round(profileData.rating || 0) ? "text-yellow-400" : "text-gray-400"} 
                      width={16} 
                    />
                  ))}
                </div>
                <span className="text-gray-300 text-sm ml-2">
                  {profileData.rating?.toFixed(1) || '0.0'} ({profileData.reviewCount || 0} {t('freelancerProfile.reviews')})
                </span>
              </div>
              
              <div className="w-full border-t border-white/10 pt-4 mt-2">
                {profileData.location && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">{t('freelancerProfile.location')}:</span>
                    <span className="text-white">{profileData.location}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.memberSince')}:</span>
                  <span className="text-white">
                    {profileData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </span>
                </div>
                {profileData.hourlyRate && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">{t('freelancerProfile.hourlyRate')}:</span>
                    <span className="text-beamly-secondary font-bold">${profileData.hourlyRate}/hr</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Completed Jobs:</span>
                  <span className="text-white">{profileData.completedProjects || 0}</span>
                </div>
              </div>
              
              <div className="w-full mt-6 space-y-3">
                <Button 
                  color="secondary" 
                  className="w-full font-medium text-beamly-third"
                  onPress={handleHireFreelancer}
                  startContent={<Icon icon="lucide:briefcase" />}
                >
                  {t('freelancerProfile.hireMe')}
                </Button>
                <Button 
                  variant="bordered" 
                  className="w-full font-medium"
                  onPress={handleSendMessage}
                  startContent={<Icon icon="lucide:message-square" />}
                >
                  {t('freelancerProfile.sendMessage')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-2/3 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="glass-effect p-6 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.aboutMe')}</h2>
              <p className="text-gray-300">
                {profileData.bio || "No bio available yet."}
              </p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="glass-effect p-6 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.skills')}</h2>
              <div className="flex flex-wrap gap-2">
                {profileData.skills?.length > 0 ? (
                  profileData.skills.map((skill: string) => (
                    <Chip key={skill} color="secondary" variant="flat">
                      {skill}
                    </Chip>
                  ))
                ) : (
                  <p className="text-gray-400">No skills listed yet.</p>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Portfolio Section - To be implemented with actual portfolio items */}
          {profileData.portfolio && profileData.portfolio.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="glass-effect p-6 rounded-xl">
                <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.portfolio')}</h2>
                <div className="grid grid-cols-3 gap-4">
                  {/* Portfolio items would go here */}
                  <p className="text-gray-400 col-span-3">Portfolio coming soon...</p>
                </div>
              </div>
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="glass-effect p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{t('freelancerProfile.reviews')}</h2>
                <div className="flex items-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon 
                        key={star} 
                        icon="lucide:star" 
                        className={star <= Math.round(profileData.rating || 0) ? "text-yellow-400" : "text-gray-400"} 
                        width={16} 
                      />
                    ))}
                  </div>
                  <span className="text-gray-300 text-sm ml-2">
                    {profileData.rating?.toFixed(1) || '0.0'} ({reviews.length} reviews)
                  </span>
                </div>
              </div>
              
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="border-t border-white/10 pt-4">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <Avatar
                            src={review.clientPhotoURL || `https://ui-avatars.com/api/?name=${review.clientName}&background=0F43EE&color=fff`}
                            className="w-10 h-10 mr-3"
                            name={review.clientName}
                          />
                          <div>
                            <h3 className="font-semibold text-white">{review.clientName}</h3>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Icon 
                                  key={star} 
                                  icon="lucide:star" 
                                  className={star <= review.rating ? "text-yellow-400" : "text-gray-400"} 
                                  width={12} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {review.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </span>
                      </div>
                      <p className="text-gray-300 mt-2">{review.comment}</p>
                      {review.jobTitle && (
                        <p className="text-sm text-gray-400 mt-2">
                          Project: {review.jobTitle}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No reviews yet. Be the first to work with {profileData.displayName}!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};