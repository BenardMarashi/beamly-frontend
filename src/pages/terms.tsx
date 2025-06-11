import React from "react";
import { TermsOfServicePage as TermsOfServicePageComponent } from "../components/footer-pages/terms-of-service-page";
import { useTheme } from "../contexts/theme-context";
import { useTranslation } from "react-i18next";
import { Breadcrumbs, BreadcrumbItem, Link } from "@heroui/react";
import { Card, CardBody } from "@heroui/react";
import { Link as RouterLink } from "react-router-dom";
import { BeamlyLogo } from "../components/beamly-logo"; // Add missing BeamlyLogo import

export const TermsOfServicePage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs className="mb-6">
        <BreadcrumbItem>
          <Link as={RouterLink} to="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>Terms of Service</BreadcrumbItem>
      </Breadcrumbs>
      
      <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Terms of Use</h1>
      
      <Card className="glass-effect border-none">
        <CardBody className={`p-6 ${isDarkMode ? 'text-white' : ''}`}>
          <div className={`prose max-w-none prose-sm md:prose-base lg:prose-lg ${isDarkMode ? 'prose-invert prose-headings:text-white prose-p:text-white prose-li:text-white prose-strong:text-white' : ''}`}>
            <p className="lead">Effective Date: 10.06.2025</p>
            
            <p>
              Welcome to Beamly. By using our platform, you agree to comply with and be bound by these Terms of Use. Please read these Terms carefully before using our services. If you do not agree with any part of these Terms, you must not use our platform.
            </p>
            
            <h2>1. Overview</h2>
            <p>
              Beamly provides a platform to connect freelancers with clients for freelance work, where freelancers offer services related to software, design, digital marketing, development, and other technology-related tasks ("Services"). The platform does not facilitate the sale of physical goods, human services unrelated to software, or any other prohibited categories under applicable regulations.
            </p>
            
            <h2>2. User Eligibility</h2>
            <p>
              You must be at least 18 years old to use the platform. By using our platform, you represent and warrant that you are of legal age to form a binding contract and that you will comply with these Terms and all applicable laws.
            </p>
            
            <h2>3. Account Registration</h2>
            <p>
              To use our platform, users must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            
            <h2>4. Prohibited Activities</h2>
            <p>
              Users of Beamly are prohibited from engaging in the following activities:
            </p>
            <ul>
              <li>Selling physical products or products that require physical delivery.</li>
              <li>Offering human services that are not related to a software offering (e.g., pure consulting or advisory services, including but not limited to legal advice, coaching, and access to a community of experts).</li>
              <li>Engaging in fraudulent, deceptive, or illegal practices, or violating any law or regulation.</li>
              <li>Infringing upon the copyrights, trademarks, or intellectual property rights of others.</li>
              <li>Facilitating any unauthorized access to third-party data, including but not limited to spyware, keyloggers, or device unlocking services.</li>
              <li>Selling or facilitating sales of prohibited or restricted content, including adult content, gambling services, and financial or investment advice.</li>
              <li>Offering services related to political or social campaigning, telemarketing, or unsolicited mass marketing.</li>
              <li>Engaging in pyramid schemes, multi-level marketing, or other deceptive marketing practices.</li>
              <li>Offering services or products related to pseudo-science, such as clairvoyance, fortune-telling, or non-evidence-based medical advice.</li>
            </ul>
            <p>
              Any attempt to violate these terms or engage in prohibited activities will result in immediate suspension or termination of the user's account.
            </p>
            
            <h2>5. Payment and Fees</h2>
            <p>
              Beamly charges a fee for using the platform, which will be specified at the time of registration or in subsequent notifications. All fees are subject to change, and you will be notified in advance of any changes. You agree to pay all applicable fees for services rendered through the platform.
            </p>
            
            <h2>6. Intellectual Property</h2>
            <p>
              All intellectual property rights in the platform, including software, content, trademarks, and logos, are owned by Beamly or its licensors. Users are granted a limited, non-transferable license to use the platform for the duration of their account, subject to these Terms.
            </p>
            
            <h2>7. Data Protection and Privacy</h2>
            <p>
              Beamly is committed to protecting your personal information. We comply with applicable data protection laws, including the EU General Data Protection Regulation (GDPR). Please refer to our Privacy Policy for details on how we collect, use, and protect your data.
            </p>
            
            <h2>8. Limitation of Liability</h2>
            <p>
              We are not responsible for any direct, indirect, incidental, or consequential damages arising out of or in connection with the use of the platform or the services provided. Our total liability to you for any claims related to these Terms shall not exceed the amount you have paid for the service that gave rise to the claim.
            </p>
            
            <h2>9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time if you violate any provision of these Terms. You may also terminate your account by contacting us directly.
            </p>
            
            <h2>10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws Albania. Any disputes will be resolved through arbitration or mediation in Tirana, unless otherwise agreed.
            </p>
            
            <h2>11. Amendments to Terms</h2>
            <p>
              We may update or modify these Terms at any time. You will be notified of any significant changes, and the updated Terms will be posted on our platform. Continued use of the platform after such changes will constitute your acceptance of the modified Terms.
            </p>
            
            <h2>12. Contact Information</h2>
            <p>
              If you have any questions regarding these Terms, please contact us at:<br />
              support@beamlyapp.com
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TermsOfServicePage;