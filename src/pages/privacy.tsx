import React from "react";
import { PrivacyPolicyPage as PrivacyPolicyPageComponent } from "../components/footer-pages/privacy-policy-page";
import { useTheme } from "../contexts/theme-context";
import { useTranslation } from "react-i18next";
import { Breadcrumbs, BreadcrumbItem, Link } from "@heroui/react";
import { Card, CardBody } from "@heroui/react";
import { Link as RouterLink } from "react-router-dom";
import { BeamlyLogo } from "../components/beamly-logo"; // Add missing BeamlyLogo import

export const PrivacyPolicyPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs className="mb-6">
        <BreadcrumbItem>
          <Link as={RouterLink} to="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>Privacy Policy</BreadcrumbItem>
      </Breadcrumbs>
      
      <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Privacy Policy</h1>
      
      <Card className="glass-effect border-none">
        <CardBody className={`p-6 ${isDarkMode ? 'text-white' : ''}`}>
          <div className={`prose max-w-none prose-sm md:prose-base lg:prose-lg ${isDarkMode ? 'prose-invert prose-headings:text-white prose-p:text-white prose-li:text-white prose-strong:text-white' : ''}`}>
            <p className="lead">Effective Date: 06.10.2025</p>
            
            <p>
              At Beamly, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and protect your personal information in accordance with applicable laws, including the General Data Protection Regulation (GDPR).
              By using our platform, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
            
            <h2>1. Information We Collect</h2>
            <p>
              We collect the following types of personal information:
            </p>
            <ul>
              <li>Account Information: When you create an account on [Your Platform Name], we collect your name, email address, username, and other contact information you provide.</li>
              <li>Payment Information: If you make a purchase through our platform, we may collect payment details necessary for processing transactions which will be handled by a third-party payment processor securely.</li>
              <li>Usage Data: We collect information about how you access and use our platform, including your IP address, browser type, device information, and browsing activity.</li>
              <li>Communications: We may collect any communications you send to us, such as inquiries, feedback, or support requests.</li>
            </ul>
            
            <h2>2. How We Use Your Information</h2>
            <p>
              We use the collected data for the following purposes:
            </p>
            <ul>
              <li>To provide and improve our services: We use your information to operate and enhance the platform, ensuring a better experience for all users.</li>
              <li>To process payments: Payment information will be handled securely by our third-party payment processor once we have a formal agreement.</li>
              <li>To communicate with you: We may use your contact information to send updates, newsletters, and other communications related to your use of our platform. You can opt out of non-essential communications at any time.</li>
              <li>To comply with legal obligations: We may use your data as required by law, such as for fraud prevention, compliance with government regulations, or responding to legal requests.</li>
            </ul>
            
            <h2>3. Data Sharing and Third-Party Services</h2>
            <p>
              We will use trusted third-party service providers for payment processing. These providers will handle your payment data securely and in compliance with applicable regulations. We do not store sensitive payment information ourselves, and our payment processor will manage your payment details securely.
            </p>
            <p>
              We may share your data with third-party service providers only for the following purposes:
            </p>
            <ul>
              <li>Service Providers: We may use third-party vendors for hosting, analytics, and other services that support our platform. These vendors are required to comply with data protection laws and process your data only for the purposes we specify.</li>
              <li>Legal Compliance: We may disclose your data if required by law or in response to legal requests by public authorities.</li>
            </ul>
            
            <h2>4. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy or as required by law. Once your data is no longer needed, we will take reasonable steps to delete or anonymize it.
            </p>
            
            <h2>5. Data Security</h2>
            <p>
              We implement reasonable and appropriate technical and organizational measures to protect your personal data from unauthorized access, loss, or alteration. However, please note that no method of data transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
            
            <h2>6. Your Rights</h2>
            <p>
              Under applicable data protection laws, including the GDPR, you have certain rights regarding your personal data. These include:
            </p>
            <ul>
              <li>Right of access: You can request access to the personal data we hold about you.</li>
              <li>Right to rectification: You can request that we correct any inaccuracies in your personal data.</li>
              <li>Right to erasure: You can request that we delete your personal data, subject to certain exceptions.</li>
              <li>Right to restrict processing: You can request that we restrict the processing of your data under specific conditions.</li>
              <li>Right to object: You can object to the processing of your data in certain circumstances.</li>
              <li>Right to data portability: You can request a copy of your data in a commonly used format.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at support@beamlyapp.com. We will respond to your request in accordance with applicable laws.
            </p>
            
            <h2>7. International Transfers</h2>
            <p>
              As our platform may involve the transfer of personal data to countries outside the European Economic Area (EEA), we ensure that any such transfer complies with applicable data protection laws and that appropriate safeguards are in place.
            </p>
            
            <h2>8. Cookies</h2>
            <p>
              We use cookies to improve the functionality of our platform and enhance your user experience. Cookies are small text files stored on your device that help us track user activity, preferences, and enhance our website's functionality. You can choose to accept or reject cookies through your browser settings, but note that some features may not function properly without them.
            </p>
            <p>
              For more details on how we use cookies, please refer to our Cookie Policy.
            </p>
            
            <h2>9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make changes, we will update the "Effective Date" at the top of this page and notify you of significant changes via email or a prominent notice on the platform.
            </p>
            
            <h2>10. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or how we handle your personal data, please contact us at:
            </p>
            <p>
              Beamly<br />
              support@beamlyapp.com<br />
              Tirana, Albania
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;