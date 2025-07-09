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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <PageHeader
        title={freelancer.name}
        subtitle={freelancer.title}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-effect sticky top-4">
              <CardBody className="text-center">
                <Avatar
                  src={freelancer.avatar}
                  className="w-32 h-32 mx-auto mb-4"
                />
                <h2 className="text-2xl font-bold text-white mb-2">{freelancer.name}</h2>
                <p className="text-gray-300 mb-4">{freelancer.title}</p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Icon icon="lucide:star" className="text-yellow-500" />
                  <span className="text-white font-semibold">{freelancer.rating}</span>
                  <span className="text-gray-400">({freelancer.completedJobs} jobs)</span>
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-white">${freelancer.hourlyRate}/hr</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Response Time</span>
                    <span className="text-white">{freelancer.responseTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Availability</span>
                    <Chip
                      color={freelancer.availability === "Available" ? "success" : "warning"}
                      size="sm"
                    >
                      {freelancer.availability}
                    </Chip>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    color="secondary"
                    className="w-full"
                    onPress={handleHire}
                  >
                    Hire Me
                  </Button>
                  <Button
                    variant="bordered"
                    className="w-full"
                    startContent={<Icon icon="lucide:message-circle" />}
                    onPress={handleMessage}
                  >
                    Message
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Skills */}
            <Card className="glass-effect mt-4">
              <CardBody>
                <h3 className="font-semibold text-white mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      variant="flat"
                      className="bg-white/10"
                    >
                      {skill}
                    </Chip>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Languages */}
            <Card className="glass-effect mt-4">
              <CardBody>
                <h3 className="font-semibold text-white mb-3">Languages</h3>
                <div className="space-y-2">
                  {freelancer.languages.map((language, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Icon icon="lucide:globe" className="text-gray-400" />
                      <span className="text-white">{language}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              {["overview", "portfolio", "reviews"].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "flat" : "light"}
                  onPress={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <Card className="glass-effect">
                <CardBody>
                  <h3 className="text-xl font-semibold text-white mb-4">About Me</h3>
                  <p className="text-gray-300 whitespace-pre-line">{freelancer.bio}</p>
                </CardBody>
              </Card>
            )}

            {activeTab === "portfolio" && (
              <div className="space-y-4">
                {freelancer.portfolio.length > 0 ? (
                  freelancer.portfolio.map((item, index) => (
                    <Card key={index} className="glass-effect">
                      <CardBody>
                        <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                        <p className="text-gray-300">{item.description}</p>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <Card className="glass-effect">
                    <CardBody className="text-center py-12">
                      <Icon icon="lucide:folder-open" className="text-6xl text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No portfolio items yet</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                {freelancer.reviews.length > 0 ? (
                  freelancer.reviews.map((review, index) => (
                    <Card key={index} className="glass-effect">
                      <CardBody>
                        <div className="flex items-start gap-4">
                          <Avatar
                            src={review.clientAvatar}
                            size="sm"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-white">{review.clientName}</h4>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Icon
                                    key={i}
                                    icon="lucide:star"
                                    className={i < review.rating ? "text-yellow-500" : "text-gray-500"}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-300">{review.comment}</p>
                            <p className="text-sm text-gray-500 mt-2">{review.date}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <Card className="glass-effect">
                    <CardBody className="text-center py-12">
                      <Icon icon="lucide:message-square" className="text-6xl text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No reviews yet</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};