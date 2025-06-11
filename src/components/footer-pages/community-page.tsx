import React from "react";
import { motion } from "framer-motion";
import { Button, Tabs, Tab, Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "../page-header";

export const CommunityPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = React.useState("discussions");
  
  const discussions = [
    {
      id: 1,
      title: "What's your favorite project management tool for freelancing?",
      author: "Sarah Johnson",
      authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=sarah1",
      date: "2 hours ago",
      replies: 24,
      views: 156,
      category: "Tools & Resources",
      excerpt: "I've been using Trello for years but I'm wondering if there are better alternatives specifically designed for freelancers. What do you all use to manage multiple clients and projects?"
    },
    {
      id: 2,
      title: "How to handle clients who constantly request revisions?",
      author: "Michael Chen",
      authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=michael1",
      date: "5 hours ago",
      replies: 37,
      views: 243,
      category: "Client Management",
      excerpt: "I'm currently dealing with a client who keeps asking for revisions beyond what was initially agreed upon. How do you set boundaries without damaging the relationship?"
    },
    {
      id: 3,
      title: "Share your biggest freelancing win this month!",
      author: "Jessica Williams",
      authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=jessica1",
      date: "1 day ago",
      replies: 42,
      views: 318,
      category: "Success Stories",
      excerpt: "Let's celebrate our achievements! I just landed my biggest client yet - a six-month contract with a major tech company. What's your recent win?"
    },
    {
      id: 4,
      title: "Tax tips for freelancers - What deductions are you taking?",
      author: "David Wilson",
      authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=david1",
      date: "2 days ago",
      replies: 29,
      views: 276,
      category: "Finance",
      excerpt: "Tax season is approaching and I want to make sure I'm not missing any important deductions. What are some lesser-known expenses that freelancers can write off?"
    }
  ];
  
  const events = [
    {
      id: 1,
      title: "Virtual Coworking Session",
      date: "Tomorrow, 2:00 PM EST",
      attendees: 18,
      type: "Online",
      image: "https://img.heroui.chat/image/ai?w=400&h=200&u=event1"
    },
    {
      id: 2,
      title: "Freelancer Mastermind Group",
      date: "January 25, 2023, 1:00 PM EST",
      attendees: 12,
      type: "Online",
      image: "https://img.heroui.chat/image/ai?w=400&h=200&u=event2"
    },
    {
      id: 3,
      title: "Beamly NYC Meetup",
      date: "February 5, 2023, 6:30 PM EST",
      attendees: 45,
      type: "In-Person",
      image: "https://img.heroui.chat/image/ai?w=400&h=200&u=event3"
    }
  ];
  
  const members = [
    {
      id: 1,
      name: "Sarah Johnson",
      image: "https://img.heroui.chat/image/avatar?w=80&h=80&u=sarah1",
      role: "Graphic Designer",
      joined: "Member since 2021",
      contributions: 156
    },
    {
      id: 2,
      name: "Michael Chen",
      image: "https://img.heroui.chat/image/avatar?w=80&h=80&u=michael1",
      role: "Web Developer",
      joined: "Member since 2020",
      contributions: 243
    },
    {
      id: 3,
      name: "Jessica Williams",
      image: "https://img.heroui.chat/image/avatar?w=80&h=80&u=jessica1",
      role: "Content Writer",
      joined: "Member since 2022",
      contributions: 87
    },
    {
      id: 4,
      name: "David Wilson",
      image: "https://img.heroui.chat/image/avatar?w=80&h=80&u=david1",
      role: "Marketing Specialist",
      joined: "Member since 2019",
      contributions: 312
    },
    {
      id: 5,
      name: "Emily Rodriguez",
      image: "https://img.heroui.chat/image/avatar?w=80&h=80&u=emily1",
      role: "UI/UX Designer",
      joined: "Member since 2021",
      contributions: 178
    },
    {
      id: 6,
      name: "James Thompson",
      image: "https://img.heroui.chat/image/avatar?w=80&h=80&u=james1",
      role: "Video Editor",
      joined: "Member since 2020",
      contributions: 205
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Beamly Community"
        subtitle="Connect, learn, and grow with fellow freelancers and clients"
        showBackButton
      />
      
      <div className="glass-effect p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome to our community!</h2>
            <p className="text-gray-300">Join discussions, attend events, and connect with other members.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              color="secondary"
              className="font-medium font-outfit text-beamly-third"
              startContent={<Icon icon="lucide:plus" />}
            >
              New Discussion
            </Button>
            <Button 
              color="primary"
              variant="bordered"
              className="text-white border-white/30"
            >
              Browse Categories
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs 
        aria-label="Community sections"
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab as any}
        color="secondary"
        variant="underlined"
        classNames={{
          tab: "data-[selected=true]:text-beamly-secondary",
          tabList: "gap-6",
          cursor: "bg-beamly-secondary"
        }}
      >
        <Tab 
          key="discussions" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:message-circle" />
              <span>Discussions</span>
            </div>
          }
        >
          <div className="py-4">
            <div className="space-y-4">
              {discussions.map((discussion) => (
                <motion.div
                  key={discussion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card p-5 card-hover"
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={discussion.authorImage}
                      className="hidden sm:flex"
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">{discussion.title}</h3>
                        <Chip
                          color="primary"
                          variant="flat"
                          className="bg-beamly-primary/20 text-beamly-primary text-xs self-start sm:self-auto mt-1 sm:mt-0"
                        >
                          {discussion.category}
                        </Chip>
                      </div>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{discussion.excerpt}</p>
                      <div className="flex flex-wrap items-center justify-between">
                        <div className="flex items-center text-sm text-gray-400">
                          <span className="hidden sm:inline">{discussion.author}</span>
                          <span className="hidden sm:inline mx-2">•</span>
                          <span>{discussion.date}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center">
                            <Icon icon="lucide:message-circle" className="mr-1" width={16} />
                            <span>{discussion.replies}</span>
                          </div>
                          <div className="flex items-center">
                            <Icon icon="lucide:eye" className="mr-1" width={16} />
                            <span>{discussion.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                color="default"
                variant="flat"
                className="text-white"
              >
                View All Discussions
              </Button>
            </div>
          </div>
        </Tab>
        
        <Tab 
          key="events" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:calendar" />
              <span>Events</span>
            </div>
          }
        >
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card overflow-hidden card-hover"
                >
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                      <Chip
                        color={event.type === "Online" ? "primary" : "secondary"}
                        variant="flat"
                        className={event.type === "Online" ? "bg-beamly-primary/20 text-beamly-primary" : "bg-beamly-secondary/20 text-beamly-secondary"}
                        size="sm"
                      >
                        {event.type}
                      </Chip>
                    </div>
                    <div className="flex items-center text-gray-300 text-sm mb-4">
                      <Icon icon="lucide:calendar" className="mr-2" width={16} />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center text-gray-300 text-sm mb-4">
                      <Icon icon="lucide:users" className="mr-2" width={16} />
                      <span>{event.attendees} attending</span>
                    </div>
                    <Button 
                      color="secondary"
                      className="w-full text-beamly-third"
                      size="sm"
                    >
                      RSVP
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                color="default"
                variant="flat"
                className="text-white"
              >
                View All Events
              </Button>
            </div>
          </div>
        </Tab>
        
        <Tab 
          key="members" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:users" />
              <span>Members</span>
            </div>
          }
        >
          <div className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card p-5 card-hover"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={member.image}
                      className="w-16 h-16"
                      size="lg"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                      <p className="text-beamly-secondary text-sm">{member.role}</p>
                      <p className="text-gray-400 text-xs">{member.joined}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <div className="text-sm text-gray-300">
                      <span className="font-semibold text-white">{member.contributions}</span> contributions
                    </div>
                    <Button 
                      color="default"
                      variant="light"
                      size="sm"
                      className="text-white"
                    >
                      View Profile
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                color="default"
                variant="flat"
                className="text-white"
              >
                View All Members
              </Button>
            </div>
          </div>
        </Tab>
      </Tabs>
      
      <div className="yellow-glass p-8 text-center mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Join Our Community Today</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          Connect with like-minded freelancers and clients, share knowledge, and grow your network.
        </p>
        <Button 
          color="secondary"
          size="lg"
          className="font-medium font-outfit text-beamly-third"
        >
          Create an Account
        </Button>
      </div>
    </div>
  );
};