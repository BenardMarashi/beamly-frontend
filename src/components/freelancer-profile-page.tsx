import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Avatar, Chip, Skeleton } from "@nextui-org/react"; // FIXED: Removed unused Image import
import { Icon } from "@iconify/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { PageHeader } from "./page-header";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

interface FreelancerData {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  skills: string[];
  hourlyRate: number;
  rating: number;
  completedJobs: number;
  responseTime: string;
  languages: string[];
  availability: string;
  portfolio: any[];
  reviews: any[];
}

export const FreelancerProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchFreelancerData();
  }, [id]);

  const fetchFreelancerData = async () => {
    if (!id) return;

    try {
      const freelancerDoc = await getDoc(doc(db, "users", id));
      
      if (freelancerDoc.exists()) {
        const data = freelancerDoc.data();
        setFreelancer({
          id: freelancerDoc.id,
          name: data.displayName || "Unknown",
          title: data.title || "Freelancer",
          bio: data.bio || "",
          avatar: data.photoURL || "",
          skills: data.skills || [],
          hourlyRate: data.hourlyRate || 0,
          rating: data.rating || 0,
          completedJobs: data.completedJobs || 0,
          responseTime: data.responseTime || "N/A",
          languages: data.languages || ["English"],
          availability: data.availability || "Available",
          portfolio: data.portfolio || [],
          reviews: data.reviews || []
        });
      } else {
        toast.error("Freelancer not found");
        navigate("/browse-freelancers");
      }
    } catch (error) {
      console.error("Error fetching freelancer:", error);
      toast.error("Failed to load freelancer profile");
    } finally {
      setLoading(false);
    }
  };

  const handleHire = () => {
    if (!user) {
      toast.error("Please login to hire freelancers");
      navigate("/login");
      return;
    }
    
    navigate(`/post-job?freelancer=${id}`);
  };

  const handleMessage = () => {
    if (!user) {
      toast.error("Please login to send messages");
      navigate("/login");
      return;
    }
    
    navigate(`/chat?user=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <PageHeader title="Loading..." subtitle="" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="glass-effect">
                <CardBody>
                  <Skeleton className="rounded-full w-32 h-32 mx-auto mb-4" />
                  <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </CardBody>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardBody>
                  <Skeleton className="h-64 w-full" />
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return null;
  }

  // Mock data for design purposes
  const mockFreelancer = {
        ...freelancer,
        name: "John Doe",
        title: "UI/UX Designer",
        bio: "I'm a UI/UX designer with over 5 years of experience creating intuitive and engaging digital experiences. My expertise includes user research, wireframing, prototyping, and visual design. I've worked with clients ranging from startups to Fortune 500 companies across various industries.",
        avatar: "https://img.heroui.chat/image/avatar?w=150&h=150&u=johndoe",
        rating: 5.0,
        completedJobs: 48,
        hourlyRate: 45,
        skills: ["UI Design", "UX Design", "Prototyping", "Figma", "Adobe XD", "User Research", "Interaction Design", "Design Systems", "Visual Design"],
        location: "New York, USA",
        memberSince: "Jan 2022",
        lastActive: "2 hours ago",
        portfolio: [
          {
            id: 1,
            title: "Dashboard Analytics",
            image: "https://img.heroui.chat/image/portfolio?w=400&h=300&u=dashboard1",
            category: "Web Design"
          },
          {
            id: 2,
            title: "Mobile Banking App",
            image: "https://img.heroui.chat/image/portfolio?w=400&h=300&u=mobile1",
            category: "Mobile Design"
          },
          {
            id: 3,
            title: "E-commerce Platform",
            image: "https://img.heroui.chat/image/portfolio?w=400&h=300&u=ecommerce1",
            category: "UX Design"
          },
          {
            id: 4,
            title: "Analytics Dashboard",
            image: "https://img.heroui.chat/image/portfolio?w=400&h=300&u=analytics1",
            category: "Data Visualization"
          }
        ],
        experience: [
          {
            position: "Senior UI/UX Designer",
            company: "Designly Agency",
            duration: "2020 - Present",
            description: "Led the design team in creating user-centered digital products for various clients. Conducted user research, created wireframes, prototypes, and final designs."
          },
          {
            position: "UI/UX Designer",
            company: "TechCorp Inc.",
            duration: "2018 - 2020", 
            description: "Designed user interfaces for web and mobile applications. Collaborated with developers to ensure proper implementation of designs."
          }
        ],
        reviews: [
          {
            id: 1,
            clientName: "Client Name",
            rating: 5,
            comment: "John did an amazing job on our project. He was very professional, responsive, and delivered high-quality work on time. Would definitely work with him again!",
            date: "2 weeks ago",
            avatar: "https://img.heroui.chat/image/avatar?w=40&h=40&u=client1"
          },
          {
            id: 2,
            clientName: "Client Name", 
            rating: 5,
            comment: "John did an amazing job on our project. He was very professional, responsive, and delivered high-quality work on time. Would definitely work with him again!",
            date: "2 weeks ago",
            avatar: "https://img.heroui.chat/image/avatar?w=40&h=40&u=client2"
          },
          {
            id: 3,
            clientName: "Client Name",
            rating: 5,
            comment: "John did an amazing job on our project. He was very professional, responsive, and delivered high-quality work on time. Would definitely work with him again!",
            date: "2 weeks ago", 
            avatar: "https://img.heroui.chat/image/avatar?w=40&h=40&u=client3"
          }
        ]
      };

  return (
    <div className="min-h-screen bg-[#010b29] pt-4 pb-32 freelancer-profile-mobile">
      <div className="px-4 space-y-6">
        {/* Profile Header */}
        <div className="mobile-profile-section">
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              src={mockFreelancer.avatar}
              className="w-20 h-20 border-2 border-white/20"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{mockFreelancer.name}</h1>
              <p className="text-gray-300 mb-2">{mockFreelancer.title}</p>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Icon 
                      key={i} 
                      icon="lucide:star" 
                      className="w-4 h-4 text-beamly-secondary"
                    />
                  ))}
                </div>
                <span className="text-white font-medium ml-1">{mockFreelancer.rating}</span>
                <span className="text-gray-400 text-sm">({mockFreelancer.completedJobs} Reviews)</span>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Location:</p>
              <p className="text-white font-medium">{mockFreelancer.location}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Member Since:</p>
              <p className="text-white font-medium">{mockFreelancer.memberSince}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Last Active:</p>
              <p className="text-white font-medium">{mockFreelancer.lastActive}</p>
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-1">Hourly Rate:</p>
            <p className="text-3xl font-bold text-beamly-secondary">${mockFreelancer.hourlyRate}/hr</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              color="secondary"
              size="lg"
              className="w-full text-beamly-third font-medium"
              onPress={handleHire}
            >
              Hire Me
            </Button>
            <Button
              variant="flat"
              size="lg"
              className="w-full bg-white/10 text-white border border-white/20"
              startContent={<Icon icon="lucide:message-circle" />}
              onPress={handleMessage}
            >
              Send Message
            </Button>
          </div>
        </div>

        {/* About Me */}
        <div className="mobile-profile-section">
          <h2 className="text-xl font-bold text-white mb-4">About Me</h2>
          <p className="text-gray-300 leading-relaxed">{mockFreelancer.bio}</p>
        </div>

        {/* Skills */}
        <div className="mobile-profile-section">
          <h2 className="text-xl font-bold text-white mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {mockFreelancer.skills.map((skill, index) => (
              <span key={index} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Portfolio */}
        <div className="mobile-profile-section">
          <h2 className="text-xl font-bold text-white mb-4">Portfolio</h2>
          <div className="portfolio-grid">
            {mockFreelancer.portfolio.map((item, index) => (
              <div key={item.id} className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Icon icon="lucide:image" className="text-white/50 text-4xl" />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium text-sm">{item.title}</h3>
                  <p className="text-gray-400 text-xs mt-1">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="mobile-profile-section">
          <h2 className="text-xl font-bold text-white mb-4">Experience</h2>
          <div className="space-y-4">
            {mockFreelancer.experience.map((exp, index) => (
              <div key={index} className="border-l border-beamly-secondary pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold">{exp.position}</h3>
                  <span className="text-beamly-secondary text-sm">{exp.duration}</span>
                </div>
                <p className="text-gray-300 font-medium text-sm mb-2">{exp.company}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="mobile-profile-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Reviews</h2>
            <span className="text-beamly-secondary text-sm font-medium">
              {mockFreelancer.rating} ({mockFreelancer.reviews.length} reviews)
            </span>
          </div>
          <div className="space-y-4">
            {mockFreelancer.reviews.map((review, index) => (
              <div key={review.id} className="border-b border-white/10 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={review.avatar}
                    className="w-10 h-10"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-medium text-sm">{review.clientName}</h4>
                      <span className="text-gray-400 text-xs">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Icon 
                          key={i} 
                          icon="lucide:star" 
                          className={`w-3 h-3 ${i < review.rating ? 'text-beamly-secondary' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button
              variant="flat"
              size="sm"
              className="bg-white/10 text-white border border-white/20"
            >
              See More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};