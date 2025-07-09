import React, { useState } from "react";
// FIXED: Removed unused motion import
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

      <div className="container mx-auto px-4 py-12">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactInfo.map((info, index) => (
            <Card key={index} className="glass-effect">
              <CardBody className="text-center p-6">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Icon icon={info.icon} className="text-2xl text-secondary" />
                </div>
                <h3 className="font-semibold text-white mb-2">{info.title}</h3>
                <p className="text-white font-medium">{info.details}</p>
                <p className="text-sm text-gray-400 mt-1">{info.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <div className="max-w-4xl mx-auto">
          <Card className="glass-effect">
            <CardBody className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Send Us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Your Name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Category"
                    placeholder="Select a category"
                    selectedKeys={new Set([formData.category])}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setFormData({ ...formData, category: selectedKey });
                    }}
                  >
                    {contactCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
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
                  />
                </div>

                <Textarea
                  label="Message"
                  placeholder="Tell us more about how we can help you..."
                  minRows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />

                <div className="flex justify-end gap-4">
                  <Button
                    variant="light"
                    onPress={() => setFormData({
                      name: "",
                      email: "",
                      subject: "",
                      category: "general",
                      message: ""
                    })}
                  >
                    Clear
                  </Button>
                  
                  <Button
                    type="submit"
                    color="secondary"
                    isLoading={isSubmitting}
                    startContent={!isSubmitting && <Icon icon="lucide:send" />}
                  >
                    Send Message
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="glass-effect">
            <CardBody className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">What are your response times?</h3>
                  <p className="text-gray-300">We typically respond to all inquiries within 24 hours during business days. For urgent matters, we recommend using our live chat feature.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Do you offer phone support?</h3>
                  <p className="text-gray-300">Yes, phone support is available Monday through Friday, 9AM to 6PM EST. For after-hours support, please use our live chat or email.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">How can I report a technical issue?</h3>
                  <p className="text-gray-300">For technical issues, please select "Technical Support" as the category in the contact form above and provide as much detail as possible about the issue you're experiencing.</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-gray-400 text-center">
                  Can't find what you're looking for? Check out our{" "}
                  <a href="/help" className="text-secondary hover:underline">Help Center</a>
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};