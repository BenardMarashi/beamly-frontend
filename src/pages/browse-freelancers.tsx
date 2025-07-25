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
import { collection, query, where, orderBy, limit, getDocs, DocumentSnapshot, startAfter, QueryConstraint } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Freelancer {
  id: string;
  displayName?: string;
  photoURL?: string;
  title?: string;
  bio?: string;
  skills?: string[];
  rating?: number;
  completedJobs?: number;
  hourlyRate?: string;
  experienceLevel?: string;
  isVerified?: boolean;
  userType?: string;
  createdAt?: any;
  email?: string;
  location?: string;
  profileCompleted?: boolean;
}

const BrowseFreelancersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(urlSearchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(urlSearchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  
  // Initialize search query and category from URL params on mount
  useEffect(() => {
    const search = urlSearchParams.get('search');
    const category = urlSearchParams.get('category');
    
    if (search) setSearchQuery(search);
    if (category) setSelectedCategory(category);
  }, [urlSearchParams]);
  
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

  const budgetRanges = [
    { value: 'all', label: 'Any Budget' },
    { value: '0-25', label: 'Under $25/hr' },
    { value: '25-50', label: '$25-$50/hr' },
    { value: '50-100', label: '$50-$100/hr' },
    { value: '100+', label: '$100+/hr' }
  ];
  
  const getCategorySkills = (category: string) => {
    const skillsMap: { [key: string]: string[] } = {
      design: ['ui-ux', 'graphic-design', 'logo-design', 'illustration', 'photoshop', 'figma', 'adobe-xd', 'sketch'],
      development: ['javascript', 'react', 'node.js', 'python', 'java', 'php', 'angular', 'vue.js', 'typescript'],
      writing: ['content-writing', 'copywriting', 'blog-writing', 'technical-writing', 'creative-writing', 'editing'],
      marketing: ['seo', 'social-media', 'google-ads', 'facebook-ads', 'email-marketing', 'content-marketing'],
      video: ['video-editing', 'animation', 'motion-graphics', 'after-effects', 'premiere-pro', '3d-animation'],
      music: ['music-production', 'audio-editing', 'voice-over', 'mixing', 'mastering', 'sound-design'],
      business: ['business-analysis', 'project-management', 'consulting', 'strategy', 'financial-analysis']
    };
    
    return skillsMap[category] || [];
  };
  
  const fetchFreelancers = React.useCallback(async (reset = false) => {
    if (!reset && loading) return;
    
    setLoading(true);
    try {
      const constraints: QueryConstraint[] = [
        where('userType', 'in', ['freelancer', 'both'])
      ];
      
      // Add category filter if not 'all'
      if (selectedCategory !== 'all') {
        const categorySkills = getCategorySkills(selectedCategory);
        if (categorySkills.length > 0) {
          constraints.push(where('skills', 'array-contains-any', categorySkills));
        }
      }
      
      // Add sorting
      switch (sortBy) {
        case 'rating':
          constraints.push(orderBy('rating', 'desc'));
          break;
        case 'completedJobs':
          constraints.push(orderBy('completedJobs', 'desc'));
          break;
        case 'hourlyRate':
          constraints.push(orderBy('hourlyRate', 'asc'));
          break;
        default:
          constraints.push(orderBy('createdAt', 'desc'));
      }
      
      if (!reset && lastDocRef.current) {
        constraints.push(startAfter(lastDocRef.current));
      }
      
      constraints.push(limit(12));
      
      const q = query(collection(db, 'users'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let newFreelancers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Freelancer));
      
      // Apply budget filter in memory
      if (budgetFilter !== 'all') {
        const [min, max] = budgetFilter.split('-').map(v => v === '100+' ? '100' : v);
        const minValue = parseInt(min);
        const maxValue = max ? parseInt(max) : Infinity;
        
        newFreelancers = newFreelancers.filter(freelancer => {
          const rate = parseInt(freelancer.hourlyRate || '0');
          if (budgetFilter === '100+') return rate >= 100;
          return rate >= minValue && rate <= maxValue;
        });
      }
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        newFreelancers = newFreelancers.filter(freelancer => 
          freelancer.displayName?.toLowerCase().includes(searchLower) ||
          freelancer.bio?.toLowerCase().includes(searchLower) ||
          freelancer.title?.toLowerCase().includes(searchLower) ||
          freelancer.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
          freelancer.location?.toLowerCase().includes(searchLower)
        );
      }
      
      if (reset) {
        setFreelancers(newFreelancers);
      } else {
        setFreelancers(prev => [...prev, ...newFreelancers]);
      }
      
      if (querySnapshot.docs.length > 0) {
        lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
      
      setHasMore(querySnapshot.docs.length === 12);
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, searchQuery, budgetFilter]);

  useEffect(() => {
    setFreelancers([]);
    lastDocRef.current = null;
    fetchFreelancers(true);
  }, [fetchFreelancers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFreelancers([]);
    lastDocRef.current = null;
    fetchFreelancers(true);
  };

  const handleFreelancerClick = React.useCallback((freelancerId: string) => {
    if (!freelancerId) {
      console.error('Invalid freelancer ID');
      return;
    }
    navigate(`/freelancer/${freelancerId}`);
  }, [navigate]);

  const getExperienceLevelLabel = (level: string) => {
    switch (level) {
      case 'entry':
        return 'Entry Level';
      case 'intermediate':
        return 'Intermediate';
      case 'expert':
        return 'Expert';
      default:
        return 'Professional';
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'F';
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-20 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">Browse Freelancers</h1>
        <p className="text-gray-300 mb-6">Find talented professionals for your projects</p>
        
        {/* Search and Filters */}
        <div className="glass-effect p-4 md:p-6 rounded-xl mb-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                size="lg"
                variant="bordered"
                placeholder="Search freelancers by name, skills, or bio..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Icon icon="lucide:search" className="text-gray-400" />}
                className="flex-1"
                classNames={{
                  input: "text-white placeholder:text-gray-400",
                  inputWrapper: "bg-white/10 border-white/20"
                }}
              />
              <Button 
                type="submit"
                color="secondary"
                size="lg"
                className="font-medium text-beamly-third md:px-8"
              >
                Search
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Category"
                selectedKeys={[selectedCategory]}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full"
                classNames={{
                  trigger: "bg-white/10 border-white/20 text-white",
                  value: "text-white",
                  label: "text-gray-400"
                }}
              >
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Select
                label="Budget Range"
                selectedKeys={[budgetFilter]}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="w-full"
                classNames={{
                  trigger: "bg-white/10 border-white/20 text-white",
                  value: "text-white",
                  label: "text-gray-400"
                }}
              >
                {budgetRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Select
                label="Sort By"
                selectedKeys={[sortBy]}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full"
                classNames={{
                  trigger: "bg-white/10 border-white/20 text-white",
                  value: "text-white",
                  label: "text-gray-400"
                }}
              >
                <SelectItem key="rating" value="rating">Highest Rated</SelectItem>
                <SelectItem key="completedJobs" value="completedJobs">Most Projects</SelectItem>
                <SelectItem key="hourlyRate" value="hourlyRate">Lowest Price</SelectItem>
                <SelectItem key="newest" value="newest">Newest</SelectItem>
              </Select>
            </div>
          </form>
        </div>
        
        {/* Freelancers Grid */}
        {loading && freelancers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass-effect">
                <CardBody className="p-6">
                  <Skeleton className="rounded-full w-16 h-16 mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : freelancers.length === 0 ? (
          <Card className="glass-effect">
            <CardBody className="text-center py-12">
              <Icon icon="lucide:users-x" className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No freelancers found</h3>
              <p className="text-gray-400">Try adjusting your filters or search terms</p>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freelancers.map((freelancer) => (
                <motion.div
                  key={freelancer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleFreelancerClick(freelancer.id)}
                  className="cursor-pointer"
                >
                  <Card className="glass-effect hover:bg-white/10 transition-all duration-200">
                    <CardBody className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        {freelancer.photoURL ? (
                          <Avatar
                            src={freelancer.photoURL}
                            className="w-16 h-16"
                            name={freelancer.displayName}
                          />
                        ) : (
                          <Avatar
                            name={getInitials(freelancer.displayName, freelancer.email)}
                            className="w-16 h-16"
                            classNames={{
                              base: "bg-beamly-secondary/20",
                              name: "text-beamly-secondary font-bold"
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">
                            {freelancer.displayName || 'Anonymous Freelancer'}
                          </h3>
                          <p className="text-sm text-gray-300">
                            {freelancer.title || getExperienceLevelLabel(freelancer.experienceLevel || '')}
                          </p>
                          {freelancer.location && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Icon icon="lucide:map-pin" className="w-3 h-3" />
                              {freelancer.location}
                            </p>
                          )}
                        </div>
                        {freelancer.isVerified && (
                          <Icon icon="lucide:check-circle" className="text-beamly-secondary" />
                        )}
                      </div>
                      
                      {freelancer.bio && (
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                          {freelancer.bio}
                        </p>
                      )}
                      
                      {freelancer.skills && freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {freelancer.skills.slice(0, 3).map((skill, idx) => (
                            <Chip 
                              key={idx} 
                              size="sm" 
                              variant="flat"
                              className="bg-white/10 text-white"
                            >
                              {skill}
                            </Chip>
                          ))}
                          {freelancer.skills.length > 3 && (
                            <Chip size="sm" variant="flat" className="bg-white/10 text-gray-400">
                              +{freelancer.skills.length - 3}
                            </Chip>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Icon icon="lucide:star" className="text-yellow-500" />
                          <span className="text-white">{freelancer.rating || '0.0'}</span>
                          <span className="text-gray-400">
                            ({freelancer.completedJobs || 0} {freelancer.completedJobs === 1 ? 'job' : 'jobs'})
                          </span>
                        </div>
                        {freelancer.hourlyRate && (
                          <span className="text-beamly-secondary font-semibold">
                            ${freelancer.hourlyRate}/hr
                          </span>
                        )}
                      </div>
                      
                      {!freelancer.profileCompleted && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Icon icon="lucide:alert-circle" className="w-3 h-3" />
                            Profile incomplete
                          </p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  color="secondary"
                  variant="bordered"
                  size="lg"
                  onClick={() => fetchFreelancers()}
                  disabled={loading}
                  className="font-medium"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseFreelancersPage;