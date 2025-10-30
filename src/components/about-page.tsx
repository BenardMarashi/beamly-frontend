import React from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "./page-header";

const stats = [
  { label: "Freelancers", value: "10M+", icon: "lucide:users" },
  { label: "Clients", value: "5M+", icon: "lucide:briefcase" },
  { label: "Projects Completed", value: "12M+", icon: "lucide:check-circle" },
  { label: "Countries", value: "190+", icon: "lucide:globe" }
];

const team = [
  {
    name: "Alex Johnson",
    role: "CEO & Founder",
    image: "https://img.heroui.chat/image/avatar?w=300&h=300&u=alex1",
    bio: "Former tech executive with a passion for connecting talent with opportunity."
  },
  {
    name: "Sarah Chen",
    role: "Chief Product Officer",
    image: "https://img.heroui.chat/image/avatar?w=300&h=300&u=sarah2",
    bio: "Product visionary focused on creating intuitive experiences for freelancers and clients."
  },
  {
    name: "Michael Rodriguez",
    role: "CTO",
    image: "https://img.heroui.chat/image/avatar?w=300&h=300&u=michael2",
    bio: "Engineering leader with expertise in building scalable marketplace platforms."
  },
  {
    name: "Jessica Kim",
    role: "Chief Marketing Officer",
    image: "https://img.heroui.chat/image/avatar?w=300&h=300&u=jessica2",
    bio: "Marketing strategist with a background in growing global tech brands."
  }
];

export const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="About Beamly"
        subtitle="Our mission, vision, and the team behind the platform"
        showBackButton
      />
      
      <div className="glass-effect p-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
            <p className="text-gray-300 mb-4">
              Founded in 2020, Beamly was born from a simple idea: create a platform where talented freelancers could connect directly with clients without the burden of high commissions.
            </p>
            <p className="text-gray-300 mb-4">
              Our founder, Alex Johnson, experienced firsthand the challenges of freelancing on traditional platforms, where high fees cut deeply into earnings. He envisioned a more equitable marketplace that prioritized both freelancers and clients.
            </p>
            <p className="text-gray-300">
              Today, Beamly has grown into a global community of over 10 million freelancers and 5 million clients, facilitating projects across 190+ countries. We remain committed to our core mission: empowering freelancers while delivering exceptional value to clients.
            </p>
          </div>
          <div className="relative">
            <motion.img 
              src="https://img.heroui.chat/image/ai?w=600&h=400&u=aboutbeamly" 
              alt="Beamly Team" 
              className="rounded-lg w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute -bottom-4 -right-4 bg-beamly-secondary text-beamly-third p-4 rounded-lg font-bold">
              Est. 2020
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Our Mission & Values</h2>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            We're guided by a set of core principles that shape everything we do
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 card-hover">
            <div className="bg-beamly-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Icon icon="lucide:heart" className="text-2xl text-beamly-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 font-outfit text-white">Zero Commission</h3>
            <p className="text-gray-300 font-outfit font-light">
              We believe freelancers should keep what they earn. Our zero-commission model ensures they receive fair compensation for their work.
            </p>
          </div>
          
          <div className="yellow-glass p-6 card-hover">
            <div className="bg-beamly-secondary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Icon icon="lucide:shield" className="text-2xl text-beamly-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 font-outfit text-white">Quality First</h3>
            <p className="text-gray-300 font-outfit font-light">
              We maintain high standards through rigorous vetting processes, ensuring clients receive exceptional work from skilled professionals.
            </p>
          </div>
          
          <div className="glass-card p-6 card-hover">
            <div className="bg-beamly-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Icon icon="lucide:globe" className="text-2xl text-beamly-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3 font-outfit text-white">Global Community</h3>
            <p className="text-gray-300 font-outfit font-light">
              We celebrate diversity and connect talent across borders, creating opportunities for freelancers and clients worldwide.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-12">
        <div className="glass-effect p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-beamly-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon={stat.icon} className="text-3xl text-beamly-secondary" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Leadership Team</h2>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            Meet the people driving Beamly's mission forward
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="glass-card overflow-hidden card-hover">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-64 object-cover object-center"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                  <p className="text-beamly-secondary text-sm mb-2">{member.role}</p>
                  <p className="text-gray-300 text-sm">{member.bio}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="yellow-glass p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Join Our Team</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          We're always looking for talented individuals who are passionate about our mission to join the Beamly team.
        </p>
        <Button 
          color="secondary"
          size="lg"
          className="font-medium font-outfit text-beamly-third"
          endContent={<Icon icon="lucide:arrow-right" />}
        >
          View Open Positions
        </Button>
      </div>
    </div>
  );
};