import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Input, 
  Button, 
  Card, 
  CardBody, 
  Avatar, 
  Chip, 
  Select, 
  SelectItem,
  Skeleton 
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { collection, query, where, orderBy, limit, getDocs, DocumentSnapshot, startAfter } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";

export const BrowseFreelancersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'writing', label: 'Writing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'video', label: 'Video & Animation' },
    { value: 'music', label: 'Music & Audio' },
    { value: 'business', label: 'Business' },
  ];
  
  const fetchFreelancers = React.useCallback(async (reset = false) => {
    if (!reset && loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    try {
      let q = query(
        collection(db, 'users'),
        where('userType', 'in', ['freelancer', 'both'])
      );
      
      // Add category filter if not 'all'
      if (selectedCategory !== 'all') {
        const categorySkills = getCategorySkills(selectedCategory);
        if (categorySkills.length > 0) {
          q = query(q, where('skills', 'array-contains-any', categorySkills));
        }
      }
      
      // Add sorting
      switch (sortBy) {
        case 'rating':
          q = query(q, orderBy('rating', 'desc'));
          break;
        case 'projects':
          q = query(q, orderBy('completedProjects', 'desc'));
          break;
        case 'newest':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        default:
          q = query(q, orderBy('rating', 'desc'));
      }
      
      // Add pagination
      q = query(q, limit(12));
      
      if (!reset && lastDocRef.current) {
        q = query(q, startAfter(lastDocRef.current));
      }
      
      const snapshot = await getDocs(q);
      
      const newFreelancers = snapshot.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().displayName || 'Anonymous',
        photoURL: doc.data().photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.data().displayName || 'User')}&background=0F43EE&color=fff`,
        bio: doc.data().bio || 'No bio available',
        rating: doc.data().rating || 0,
        completedProjects: doc.data().completedProjects || 0,
        hourlyRate: doc.data().hourlyRate || 0,
        skills: doc.data().skills || [],
        isAvailable: doc.data().isAvailable !== false, // Default to true
        ...doc.data()
      }));
      
      if (reset) {
        setFreelancers(newFreelancers);
        lastDocRef.current = null; // Reset pagination
      } else {
        setFreelancers(prev => [...prev, ...newFreelancers]);
      }
      
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
      setHasMore(snapshot.docs.length === 12);
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      // Keep existing data on error, don't clear it
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy]);
  
  useEffect(() => {
    fetchFreelancers(true);
  }, [fetchFreelancers]);
  
  const getCategorySkills = (category: string): string[] => {
    const skillsMap: Record<string, string[]> = {
      design: ['ui-design', 'ux-design', 'graphic-design', 'web-design', 'figma', 'adobe-photoshop'],
      development: ['javascript', 'react', 'node.js', 'python', 'java', 'php'],
      writing: ['content-writing', 'copywriting', 'blog-writing', 'technical-writing'],
      marketing: ['seo', 'social-media', 'google-ads', 'facebook-ads', 'email-marketing'],
      video: ['video-editing', 'animation', 'motion-graphics', 'after-effects'],
      music: ['music-production', 'audio-editing', 'voice-over', 'mixing'],
      business: ['business-analysis', 'project-management', 'consulting', 'strategy']
    };
    
    return skillsMap[category] || [];
  };
  
  const filteredFreelancers = freelancers.filter(freelancer => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      freelancer.displayName?.toLowerCase().includes(searchLower) ||
      freelancer.bio?.toLowerCase().includes(searchLower) ||
      freelancer.skills?.some((skill: string) => skill.toLowerCase().includes(searchLower))
    );
  });
  
  const handleFreelancerClick = React.useCallback((freelancerId: string) => {
    console.log('Navigating to freelancer profile:', freelancerId);
    navigate(`/freelancer/${freelancerId}`);
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-2 text-white">Browse Freelancers</h1>
        <p className="text-gray-300 mb-6">Find talented professionals for your projects</p>
        
        {/* Search and Filters */}
        <div className="glass-effect p-6 rounded-xl mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              size="lg"
              variant="bordered"
              placeholder={t('browseFreelancers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-white/10"
              startContent={<Icon icon="lucide:search" className="text-gray-400" />}
            />
            <Select
              variant="bordered"
              selectedKeys={[selectedCategory]}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="md:w-48"
              aria-label="Filter by category"
              classNames={{
                trigger: "bg-gray-900/50 border-gray-600 text-white",
                value: "text-white",
                listbox: "bg-gray-900",
                popoverContent: "bg-gray-900",
              }}
            >
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              variant="bordered"
              selectedKeys={[sortBy]}
              onChange={(e) => setSortBy(e.target.value)}
              className="md:w-48"
              aria-label="Sort freelancers by"
              classNames={{
                trigger: "bg-gray-900/50 border-gray-600 text-white",
                value: "text-white",
                listbox: "bg-gray-900",
                popoverContent: "bg-gray-900",
              }}
            >
              <SelectItem key="rating" value="rating">Highest Rated</SelectItem>
              <SelectItem key="projects" value="projects">Most Projects</SelectItem>
              <SelectItem key="newest" value="newest">Newest</SelectItem>
            </Select>
          </div>
        </div>
        
        {/* Freelancers Grid */}
        {loading && freelancers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="glass-card">
                <CardBody className="p-5">
                  <Skeleton className="rounded-full w-16 h-16 mx-auto mb-3" />
                  <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : filteredFreelancers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFreelancers.map((freelancer, index) => {
              const cardClass = `${index % 2 === 0 ? 'glass-card' : 'yellow-glass'} border-none card-hover cursor-pointer`;
              return (
                <motion.div
                  key={freelancer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                >
                  <Card 
                    className={cardClass}
                    isPressable
                    onPress={() => handleFreelancerClick(freelancer.id)}
                  >
                  <CardBody className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar 
                        src={freelancer.photoURL} 
                        name={freelancer.displayName}
                        className="w-16 h-16"
                      />
                      <div>
                        <h3 className="font-semibold text-white">{freelancer.displayName || 'Unnamed User'}</h3>
                        <p className="text-gray-400 text-sm">{freelancer.bio || 'No bio available'}</p>
                        <div className="flex items-center mt-1">
                          <Icon icon="lucide:star" className="text-beamly-secondary mr-1" />
                          <span className="text-white">{freelancer.rating || '0.0'}</span>
                          <span className="text-gray-400 text-xs ml-2">({freelancer.completedProjects || 0} projects)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {freelancer.skills?.slice(0, 3).map((skill: string, i: number) => (
                          <Chip 
                            key={i} 
                            size="sm"
                            className="bg-white/10 text-white"
                          >
                            {skill}
                          </Chip>
                        ))}
                      </div>
                      
                      {/* Hourly Rate and View Profile Button */}
                      <div className="flex justify-between items-center mt-4">
                        <div>
                          {freelancer.hourlyRate && (
                            <span className="text-beamly-secondary font-bold">
                              ${freelancer.hourlyRate}
                            </span>
                          )}
                          {freelancer.hourlyRate && (
                            <span className="text-gray-400 text-xs ml-1">/ hr</span>
                          )}
                        </div>
                        <div
                          className="px-3 py-1 bg-beamly-secondary text-beamly-third text-sm font-medium rounded-lg hover:bg-beamly-secondary/80 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFreelancerClick(freelancer.id);
                          }}
                        >
                          View Profile
                        </div>
                      </div>
                      
                      {/* Availability Badge */}
                      {freelancer.isAvailable && (
                        <div className="mt-2">
                          <Chip
                            size="sm"
                            color="success"
                            variant="dot"
                          >
                            Available
                          </Chip>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon icon="lucide:users-x" className="text-6xl text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No freelancers found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
        
        {/* Load More */}
        {!loading && hasMore && filteredFreelancers.length > 0 && (
          <div className="text-center mt-8">
            <Button
              color="primary"
              variant="bordered"
              onPress={() => fetchFreelancers(false)}
              className="text-white border-white/30"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseFreelancersPage;