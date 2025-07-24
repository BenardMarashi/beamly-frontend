// This is the complete file you already have from our previous response
// src/pages/home.tsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, CardBody, Avatar, Badge } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme-context";
import { useTranslation } from "react-i18next";
import { collection, query, where, limit, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";

interface Job {
  id: string;
  title: string;
  clientName: string;
  clientPhotoURL?: string;
  createdAt: any;
}

interface Freelancer {
  id: string;
  displayName: string;
  title?: string;
  photoURL?: string;
  rating?: number;
  completedProjects?: number;
  skills?: string[];
}

interface Project {
  id: string;
  title: string;
  progress?: number;
  dueDate?: any;
  category?: string;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<Freelancer[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add custom scrollbar hiding styles and enable drag scrolling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .overflow-x-auto {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
      .overflow-x-auto.active {
        cursor: grabbing !important;
      }
    `;
    document.head.appendChild(style);

    // Enable drag scrolling on desktop
    const scrollContainers = document.querySelectorAll('.overflow-x-auto');
    
    scrollContainers.forEach(container => {
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      const handleMouseDown = (e: Event) => {
        isDown = true;
        container.classList.add('active');
        startX = (e as MouseEvent).pageX - (container as HTMLElement).offsetLeft;
        scrollLeft = container.scrollLeft;
      };

      const handleMouseLeave = () => {
        isDown = false;
        container.classList.remove('active');
      };

      const handleMouseUp = () => {
        isDown = false;
        container.classList.remove('active');
      };

      const handleMouseMove = (e: Event) => {
        if (!isDown) return;
        e.preventDefault();
        const x = (e as MouseEvent).pageX - (container as HTMLElement).offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed
        container.scrollLeft = scrollLeft - walk;
      };

      const handleWheel = (e: Event) => {
        e.preventDefault();
        container.scrollLeft += (e as WheelEvent).deltaY;
      };

      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mouseleave', handleMouseLeave);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('wheel', handleWheel, { passive: false });
    });

    return () => {
      document.head.removeChild(style);
    };
  }, [featuredJobs, topFreelancers]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch featured jobs
  useEffect(() => {
    if (!user) return;

    const jobsQuery = query(
      collection(db, 'jobs'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(jobsQuery, 
      (snapshot) => {
        const jobs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            clientName: data.clientName || t('home.unknownClient'),
            clientPhotoURL: data.clientPhotoURL,
            createdAt: data.createdAt
          } as Job;
        });
        setFeaturedJobs(jobs);
      },
      (error) => {
        console.error("Error fetching jobs:", error);
        toast.error(t('home.errors.loadJobs'));
        setFeaturedJobs([]);
      }
    );

    return () => unsubscribe();
  }, [user, t]);

  // Fetch top freelancers
  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | undefined;

    const fetchTopFreelancers = async () => {
      try {
        const baseConstraints = [
          where('userType', 'in', ['freelancer', 'both']),
          where('profileCompleted', '==', true),
          limit(10)
        ];

        try {
          // Try with rating first
          const freelancersQuery = query(
            collection(db, 'users'),
            ...baseConstraints,
            orderBy('rating', 'desc')
          );

          unsubscribe = onSnapshot(freelancersQuery, 
            (snapshot) => {
              const freelancers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  displayName: data.displayName || t('home.unknownUser'),
                  title: data.title || '',
                  photoURL: data.photoURL || '',
                  rating: data.rating || 5.0,
                  completedProjects: data.completedProjects || 0,
                  skills: data.skills || []
                } as Freelancer;
              });
              setTopFreelancers(freelancers);
            },
            (error) => {
              console.error("Error fetching freelancers with rating:", error);
              // If ordering by rating fails, try without it
              const simpleQuery = query(
                collection(db, 'users'),
                ...baseConstraints
              );
              
              unsubscribe = onSnapshot(simpleQuery, 
                (snapshot) => {
                  const freelancers = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                      id: doc.id,
                      displayName: data.displayName || t('home.unknownUser'),
                      title: data.title || '',
                      photoURL: data.photoURL || '',
                      rating: data.rating || 5.0,
                      completedProjects: data.completedProjects || 0,
                      skills: data.skills || []
                    } as Freelancer;
                  });
                  // Sort by rating client-side if needed
                  freelancers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                  setTopFreelancers(freelancers.slice(0, 10));
                }
              );
            }
          );
        } catch (initialError) {
          console.error("Initial freelancer query setup failed:", initialError);
          // Fallback to simple query
          const simpleQuery = query(
            collection(db, 'users'),
            where('userType', 'in', ['freelancer', 'both']),
            limit(10)
          );
          
          unsubscribe = onSnapshot(simpleQuery, 
            (snapshot) => {
              const freelancers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  displayName: data.displayName || t('home.unknownUser'),
                  title: data.title || '',
                  photoURL: data.photoURL || '',
                  rating: data.rating || 5.0,
                  completedProjects: data.completedProjects || 0,
                  skills: data.skills || []
                } as Freelancer;
              });
              setTopFreelancers(freelancers);
            }
          );
        }
      } catch (error) {
        console.error("Error in fetchTopFreelancers:", error);
        setTopFreelancers([]);
      }
    };

    fetchTopFreelancers();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, t]);

  // Fetch user's active projects
  useEffect(() => {
    if (!user || !userData) return;

    const fetchActiveProjects = async () => {
      try {
        const projectsQuery = userData.userType === 'freelancer' 
          ? query(
              collection(db, 'contracts'),
              where('freelancerId', '==', user.uid),
              where('status', 'in', ['active', 'in_progress']),
              limit(2)
            )
          : query(
              collection(db, 'contracts'),
              where('clientId', '==', user.uid),
              where('status', 'in', ['active', 'in_progress']),
              limit(2)
            );

        const unsubscribe = onSnapshot(projectsQuery, 
          (snapshot) => {
            const projects = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title || t('home.untitledProject'),
                progress: data.progress || 0,
                dueDate: data.dueDate,
                category: data.category || 'general'
              } as Project;
            });
            setActiveProjects(projects);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching projects:", error);
            setActiveProjects([]);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    fetchActiveProjects();
  }, [user, userData, t]);

  // Fetch notification count
  useEffect(() => {
    if (!user) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(notificationsQuery, 
      (snapshot) => {
        setNotificationCount(snapshot.size);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Updated navigation function
  const navigateToPage = (page: string) => {
    if (page.includes('?')) {
      // Handle pages with query parameters
      const [path, queryString] = page.split('?');
      navigate(`/${path}?${queryString}`);
    } else if (page === 'signup-freelancer') {
      navigate('/signup?type=freelancer');
    } else if (page === 'signup-company') {
      navigate('/signup?type=client');
    } else {
      navigate(`/${page}`);
    }
  };

  const categories = [
    { name: t('home.categories.design'), icon: "lucide:palette", page: "browse-freelancers?category=design" },
    { name: t('home.categories.development'), icon: "lucide:code", page: "browse-freelancers?category=development" },
    { name: t('home.categories.writing'), icon: "lucide:pen-tool", page: "browse-freelancers?category=writing" },
    { name: t('home.categories.marketing'), icon: "lucide:megaphone", page: "browse-freelancers?category=marketing" },
    { name: t('home.categories.video'), icon: "lucide:video", page: "browse-freelancers?category=video" },
    { name: t('home.categories.music'), icon: "lucide:music", page: "browse-freelancers?category=music" },
    { name: t('home.categories.business'), icon: "lucide:briefcase", page: "browse-freelancers?category=business" },
    { name: t('home.categories.data'), icon: "lucide:database", page: "browse-freelancers?category=data" },
    { name: t('home.categories.photography'), icon: "lucide:camera", page: "browse-freelancers?category=photography" },
    { name: t('home.categories.translation'), icon: "lucide:languages", page: "browse-freelancers?category=translation" }
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/browse-freelancers?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const calculateDaysLeft = (dueDate: any) => {
    if (!dueDate) return t('home.noDeadline');
    
    try {
      const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
      const now = new Date();
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? t('home.dueInDays', { days: diffDays }) : t('home.overdue');
    } catch (error) {
      console.error('Error calculating days left:', error);
      return t('home.noDeadline');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Icon icon="eos-icons:loading" className="text-4xl text-beamly-secondary animate-spin mx-auto mb-4" />
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {t('home.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] pb-8">
      {/* Welcome section with search */}
      <div className="px-4">
        <div className={`${isDarkMode ? 'glass-effect' : 'bg-white shadow-md'} mt-4 p-4 md:p-6 rounded-2xl md:rounded-3xl max-w-7xl mx-auto`}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4 md:mb-6">
            <Avatar 
              src={userData?.photoURL} 
              name={userData?.displayName || 'User'}
              className="w-12 h-12 border-2 border-beamly-secondary flex-shrink-0"
              classNames={{
                base: !userData?.photoURL ? "bg-beamly-secondary/20" : "",
                name: "text-beamly-secondary font-bold"
              }}
            />
            <div className="flex-1">
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('home.greeting', { name: userData?.displayName || t('home.there') })}
              </p>
              <h1 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {t('home.whatLooking')}
              </h1>
            </div>
            <div className="ml-auto">
              <Badge 
                color="secondary" 
                content={notificationCount > 0 ? notificationCount.toString() : undefined}
                shape="circle" 
                isInvisible={notificationCount === 0}
              >
                <Button 
                  isIconOnly 
                  variant="light" 
                  className={isDarkMode ? "text-white" : "text-gray-800"}
                  onPress={() => navigate('/notifications')}
                >
                  <Icon icon="lucide:bell" width={24} />
                </Button>
              </Badge>
            </div>
          </div>
          
          <div className="relative">
            <Input
              placeholder={t('home.searchPlaceholder')}
              value={searchQuery}
              onValueChange={setSearchQuery}
              size="lg"
              radius="lg"
              className={isDarkMode ? "bg-white/10 border-white/20" : "bg-gray-50 border-gray-200"}
              startContent={<Icon icon="lucide:search" className="text-gray-400" />}
              endContent={
                <div className="flex items-center gap-2">
                  {searchQuery && (
                    <Button isIconOnly size="sm" variant="light" className="text-gray-400" onPress={() => setSearchQuery("")}>
                      <Icon icon="lucide:x" width={16} />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    color="secondary"
                    className="font-medium text-beamly-third"
                    onPress={handleSearch}
                  >
                    Search
                  </Button>
                </div>
              }
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-6 md:mt-8">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('home.jobCategories')}
          </h2>
          <Button
            variant="light"
            className="text-beamly-secondary p-0"
            endContent={<Icon icon="lucide:chevron-right" />}
            onPress={() => navigate("/browse-freelancers")}
          >
            {t('home.seeAll')}
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar cursor-grab active:cursor-grabbing">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="min-w-[110px] sm:min-w-[130px]"
            >
              <Button
                className={`w-full h-[90px] ${isDarkMode ? 'glass-card' : 'bg-white shadow-sm hover:shadow-md'} flex flex-col gap-2 p-3 transition-all`}
                onPress={() => navigateToPage(category.page)}
              >
                <Icon icon={category.icon} className="text-beamly-secondary text-2xl" />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {category.name}
                </span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured Jobs */}
      <div className="px-4 mt-6 md:mt-8">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('home.featuredJobs')}
          </h2>
          <Button
            variant="light"
            className="text-beamly-secondary p-0"
            endContent={<Icon icon="lucide:chevron-right" />}
            onPress={() => navigate("/looking-for-work")}
          >
            {t('home.explore')}
          </Button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar cursor-grab active:cursor-grabbing">
          {featuredJobs.length > 0 ? (
            featuredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                className="min-w-[110px] sm:min-w-[130px]"
              >
                <Card 
                  className={`${isDarkMode ? 'glass-card' : 'bg-white shadow-md'} border-none card-hover h-[160px] w-full`}
                  isPressable
                  onPress={() => navigate(`/job/${job.id}`)}
                >
                  <CardBody className="p-3 flex flex-col items-center justify-center text-center">
                    {job.clientPhotoURL ? (
                      <Avatar
                        src={job.clientPhotoURL} 
                        className="w-10 h-10 mb-2"
                        name={job.clientName}
                      />
                    ) : (
                      <Avatar
                        name={job.clientName || 'Client'}
                        className="w-10 h-10 mb-2"
                        classNames={{
                          base: "bg-beamly-secondary/20",
                          name: "text-beamly-secondary text-xs font-bold"
                        }}
                      />
                    )}
                    <h3 className={`font-semibold text-xs line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {job.title || t('home.untitledJob')}
                    </h3>
                    <p className={`text-xs mt-1 truncate w-full ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {job.clientName || t('home.anonymous')}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="w-full text-center py-8">
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                {t('home.noJobsAvailable')}
              </p>
              <Button 
                color="secondary" 
                size="sm" 
                className="mt-2"
                onPress={() => navigate('/post-job')}
              >
                {t('home.postJob')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Top Freelancers */}
      <div className="px-4 mt-6 md:mt-8">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('home.topFreelancers')}
          </h2>
          <Button
            variant="light"
            className="text-beamly-secondary p-0"
            endContent={<Icon icon="lucide:chevron-right" />}
            onPress={() => navigate("/browse-freelancers")}
          >
            {t('home.seeAll')}
          </Button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar cursor-grab active:cursor-grabbing">
          {topFreelancers.length > 0 ? (
            topFreelancers.map((freelancer, index) => (
              <motion.div
                key={freelancer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="min-w-[110px] sm:min-w-[130px]"
              >
                <Card 
                  className={`${index % 2 === 0 ? (isDarkMode ? 'glass-card' : 'bg-white shadow-md') : 'yellow-glass shadow-md'} border-none card-hover h-[200px] w-full overflow-hidden`}
                  isPressable
                  onPress={() => navigate(`/freelancer/${freelancer.id}`)}
                >
                  <CardBody className="p-3 flex flex-col items-center text-center">
                    <Avatar 
                      src={freelancer.photoURL} 
                      name={freelancer.displayName}
                      className="w-10 h-10 mb-1"
                      classNames={{
                        base: !freelancer.photoURL ? "bg-beamly-secondary/20" : "",
                        name: "text-beamly-secondary text-xs font-bold"
                      }}
                    />
                    <h3 className={`font-semibold text-xs truncate w-full ${isDarkMode || index % 2 === 1 ? 'text-white' : 'text-gray-800'}`}>
                      {freelancer.displayName}
                    </h3>
                    <p className={`text-xs truncate w-full ${isDarkMode || index % 2 === 1 ? 'text-gray-400' : 'text-gray-600'}`}>
                      {freelancer.title || freelancer.skills?.[0] || t('home.freelancer')}
                    </p>
                    <div className="flex items-center mt-1 text-xs">
                      <Icon icon="lucide:star" className="text-beamly-secondary mr-1 w-3 h-3" />
                      <span className={isDarkMode || index % 2 === 1 ? 'text-white' : 'text-gray-800'}>
                        {freelancer.rating || 5.0}
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-beamly-secondary font-bold text-lg">
                        {freelancer.completedProjects || 0}
                      </div>
                      <div className={`text-xs ${isDarkMode || index % 2 === 1 ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('home.projects')}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="w-full text-center py-8">
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                {t('home.noFreelancersAvailable')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;