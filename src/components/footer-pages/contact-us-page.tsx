import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Textarea } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "../page-header";

export const ContactUsPage: React.FC = () => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  
  const contactMethods = [
    {
      title: "Email Us",
      description: "For general inquiries and support",
      icon: "lucide:mail",
      contact: "support@beamly.com",
      color: "#0F43EE"
    },
    {
      title: "Call Us",
      description: "Monday-Friday, 9am-5pm EST",
      icon: "lucide:phone",
      contact: "+1 (555) 123-4567",
      color: "#FCE90D"
    },
    {
      title: "Visit Us",
      description: "Our headquarters location",
      icon: "lucide:map-pin",
      contact: "123 Tech Lane, San Francisco, CA",
      color: "#0F43EE"
    }
  ];
  
  const departments = [
    { name: "General Inquiry", icon: "lucide:help-circle" },
    { name: "Technical Support", icon: "lucide:tool" },
    { name: "Billing & Payments", icon: "lucide:credit-card" },
    { name: "Partnerships", icon: "lucide:handshake" },
    { name: "Press & Media", icon: "lucide:newspaper" },
    { name: "Careers", icon: "lucide:briefcase" }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Contact Us"
        subtitle="Get in touch with our team for any questions or support"
        showBackButton
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="glass-effect p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Send Us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onValueChange={setName}
                    startContent={<Icon icon="lucide:user" className="text-gray-400" />}
                    className="bg-white/10 border-white/20"
                    variant="bordered"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onValueChange={setEmail}
                    startContent={<Icon icon="lucide:mail" className="text-gray-400" />}
                    className="bg-white/10 border-white/20"
                    variant="bordered"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  Subject
                </label>
                <Input
                  id="subject"
                  placeholder="What is your message about?"
                  value={subject}
                  onValueChange={setSubject}
                  className="bg-white/10 border-white/20"
                  variant="bordered"
                />
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  Department
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {departments.map((dept, index) => (
                    <Button
                      key={index}
                      variant="flat"
                      color="default"
                      className="bg-white/10 text-white justify-start"
                      startContent={<Icon icon={dept.icon} />}
                    >
                      {dept.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-200 mb-1 font-outfit">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={message}
                  onValueChange={setMessage}
                  className="bg-white/10 border-white/20 min-h-[150px]"
                  variant="bordered"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-300">
                  We'll respond within 24-48 hours
                </p>
                <Button 
                  color="secondary"
                  size="lg"
                  className="font-medium font-outfit text-beamly-third"
                >
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
        
        <div>
          <div className="glass-effect p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Contact Information</h3>
            <div className="space-y-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="flex items-start">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
                    style={{ backgroundColor: `${method.color}20` }}
                  >
                    <Icon icon={method.icon} className="text-xl" style={{ color: method.color }} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{method.title}</h4>
                    <p className="text-gray-400 text-sm mb-1">{method.description}</p>
                    <p className="text-beamly-secondary">{method.contact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="yellow-glass p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Office Hours</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Monday - Friday:</span>
                <span className="text-white">9:00 AM - 5:00 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Saturday:</span>
                <span className="text-white">10:00 AM - 2:00 PM EST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Sunday:</span>
                <span className="text-white">Closed</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-white font-medium mb-2">Follow Us</h4>
              <div className="flex gap-3">
                {["lucide:facebook", "lucide:twitter", "lucide:instagram", "lucide:linkedin"].map((social, index) => (
                  <a 
                    key={index} 
                    href="#" 
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-beamly-secondary hover:text-beamly-third transition-all"
                  >
                    <Icon icon={social} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="glass-effect p-6 md:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">How quickly will I receive a response?</h3>
            <p className="text-gray-300">We aim to respond to all inquiries within 24-48 business hours. For urgent matters, please indicate this in your subject line.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Can I schedule a call with your team?</h3>
            <p className="text-gray-300">Yes, you can request a call in your message, and our team will reach out to schedule a convenient time for a phone or video call.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Do you offer in-person meetings?</h3>
            <p className="text-gray-300">In-person meetings are available by appointment at our headquarters in San Francisco for enterprise clients and partners.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">How can I report a technical issue?</h3>
            <p className="text-gray-300">For technical issues, please select "Technical Support" as your department and provide as much detail as possible about the problem you're experiencing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};