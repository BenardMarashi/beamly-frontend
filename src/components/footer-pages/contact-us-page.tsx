import React, { useState } from "react";
import { Card, CardBody, Input, Textarea, Button, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "../page-header";
import { toast } from "react-hot-toast";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

const contactCategories = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing & Payments" },
  { value: "partnership", label: "Partnership Opportunities" },
  { value: "feedback", label: "Feedback & Suggestions" },
  { value: "other", label: "Other" }
];

const contactInfo = [
  {
    icon: "lucide:mail",
    title: "Email Us",
    details: "support@beamly.com",
    description: "We'll respond within 24 hours"
  },
  {
    icon: "lucide:message-circle",
    title: "Live Chat",
    details: "Available 24/7",
    description: "Get instant help from our team"
  },
  {
    icon: "lucide:phone",
    title: "Call Us",
    details: "+1 (555) 123-4567",
    description: "Mon-Fri, 9AM-6PM EST"
  },
  {
    icon: "lucide:map-pin",
    title: "Visit Us",
    details: "123 Innovation Drive, Tech City, TC 12345",
    description: "By appointment only"
  }
];

export const ContactUsPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    category: "general",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Message sent successfully! We'll get back to you soon.");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "general",
        message: ""
      });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <PageHeader
        title="Contact Us"
        subtitle="We're here to help. Reach out to us anytime!"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="glass-effect">
              <CardBody className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      variant="bordered"
                    />
                    <Input
                      type="email"
                      label="Email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      variant="bordered"
                    />
                  </div>
                  
                  <Select
                    label="Category"
                    placeholder="Select a category"
                    selectedKeys={[formData.category]}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    variant="bordered"
                    classNames={{
                      trigger: "bg-gray-900/50 border-gray-600 text-white",
                      value: "text-white",
                      listbox: "bg-gray-900",
                      popoverContent: "bg-gray-900",
                    }}
                  >
                    {contactCategories.map((category) => (
                      <SelectItem key={category.value} textValue={category.label}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </Select>
                  
                  <Input
                    label="Subject"
                    placeholder="Brief description of your inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    variant="bordered"
                  />
                  
                  <Textarea
                    label="Message"
                    placeholder="Tell us more about your inquiry..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    minRows={5}
                    variant="bordered"
                  />
                  
                  <Button
                    type="submit"
                    color="secondary"
                    size="lg"
                    className="w-full"
                    isLoading={isSubmitting}
                  >
                    Send Message
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>
          
          <div className="space-y-4">
            {contactInfo.map((info, index) => (
              <Card key={index} className="glass-effect">
                <CardBody className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-beamly-secondary/20 p-3 rounded-full">
                      <Icon icon={info.icon} className="text-2xl text-beamly-secondary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{info.title}</h3>
                      <p className="text-white font-medium">{info.details}</p>
                      <p className="text-gray-400 text-sm">{info.description}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};