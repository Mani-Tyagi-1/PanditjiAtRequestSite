import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Navigation } from '../components/NewComponents/Navigation';

const SectionCard = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden"
  >
    <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold shrink-0">
        {number}
      </span>
      <h2 className="text-base md:text-lg font-bold text-orange-800">{title}</h2>
    </div>
    <div className="px-6 py-5 text-sm text-stone-700 leading-relaxed space-y-3">
      {children}
    </div>
  </motion.div>
);

const SubSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mt-4">
    <p className="font-semibold text-orange-700 mb-2">{label}</p>
    <div className="pl-3 border-l-2 border-orange-200 space-y-2">{children}</div>
  </div>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
    <span>{children}</span>
  </li>
);

const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 space-y-1">
    {children}
  </div>
);

export default function PanditPrivacyPolicy() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 mt-20">

        {/* Header */}
        <header className="bg-gradient-to-r from-orange-50 via-white to-orange-50 border-b border-orange-200/50">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-full mb-6 shadow-lg shadow-orange-500/30"
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Panditji Privacy Matters</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Privacy Policy
              </h1>
              <p className="text-lg text-gray-700 font-medium">Pandit Ji : Pandit Ji At Req</p>
              <p className="mt-2 text-orange-600 font-semibold">Last Updated: March 2026</p>
            </motion.div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-5">

          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border border-orange-100 shadow-sm px-6 py-5 text-sm text-stone-700 leading-relaxed space-y-3"
          >
            <p className="font-bold text-orange-800 text-base">Privacy Policy – Pandit Ji : Pandit Ji At Req</p>
            <p>
              This Privacy Policy explains how Vedic Vaibhav Dot Com Pvt Ltd ("Company", "we", "us", or "our") collects, uses, stores, shares, and protects personal data when pandits, priests, or service partners ("Pandit", "Partner", "you") use the Pandit Ji : Pandit Ji At Req mobile application, website, and related partner services (collectively, the "Platform").
            </p>
            <p>
              By registering, logging in, onboarding, accepting bookings, or otherwise using the Platform, you agree to this Privacy Policy.
            </p>
          </motion.div>

          {/* 1. Company Details */}
          <SectionCard number="1" title="Company Details">
            <ul className="space-y-1.5 list-none">
              <li><span className="font-medium text-stone-800">Company:</span> Vedic Vaibhav Dot Com Pvt Ltd</li>
              <li><span className="font-medium text-stone-800">Registered Office:</span> #1031 Tricity Trade Tower, Patiala Zirakpur Road, Zirakpur, Punjab, India</li>
              <li><span className="font-medium text-stone-800">Support / Privacy Contact:</span> panditjiatrequest@vedicvaibhav.com</li>
              <li><span className="font-medium text-stone-800">Phone:</span> +91 98727 88769</li>
            </ul>
          </SectionCard>

          {/* 2. Who This Policy Applies To */}
          <SectionCard number="2" title="Who This Policy Applies To">
            <p>
              This Privacy Policy applies to pandits, priests, representatives, and other service providers who use the Pandit Ji : Pandit Ji At Req app or related partner systems for onboarding, booking management, service coordination, location sharing, communication, voice/video calling, booking fulfillment, payouts, support, and operational management.
            </p>
          </SectionCard>

          {/* 3. Information We Collect */}
          <SectionCard number="3" title="Information We Collect">

            <SubSection label="A. Onboarding and Profile Information">
              <p>We may collect:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>full name</Bullet>
                <Bullet>mobile number</Bullet>
                <Bullet>email address</Bullet>
                <Bullet>residential address and city</Bullet>
                <Bullet>profile photo</Bullet>
                <Bullet>language preferences</Bullet>
                <Bullet>puja, ritual, and service specializations</Bullet>
                <Bullet>experience and qualification details</Bullet>
                <Bullet>identity or verification information, if required during onboarding</Bullet>
                <Bullet>bank account, UPI, PAN, or payout-related details, if collected for settlements</Bullet>
                <Bullet>emergency or alternate contact details, if provided</Bullet>
              </ul>
            </SubSection>

            <SubSection label="B. Account and Login Information">
              <p>When you sign up or log in, we may collect:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>mobile number</Bullet>
                <Bullet>OTP verification status</Bullet>
                <Bullet>account identifiers</Bullet>
                <Bullet>session information</Bullet>
                <Bullet>device-linked authentication details</Bullet>
              </ul>
            </SubSection>

            <SubSection label="C. Booking and Service Information">
              <p>We may collect:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>assigned bookings</Bullet>
                <Bullet>booking history</Bullet>
                <Bullet>accepted, declined, cancelled, completed, or missed booking status</Bullet>
                <Bullet>service timing and schedule</Bullet>
                <Bullet>devotee/service address relevant to a booking</Bullet>
                <Bullet>notes, instructions, and service remarks</Bullet>
                <Bullet>arrival, start, and completion timestamps</Bullet>
                <Bullet>ratings, complaints, and feedback related to your services</Bullet>
              </ul>
            </SubSection>

            <SubSection label="D. Location Information">
              <p>We may collect:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>approximate location</Bullet>
                <Bullet>precise location</Bullet>
                <Bullet>background location</Bullet>
              </ul>
              <p className="mt-2">This app collects location data to enable:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>live booking tracking</Bullet>
                <Bullet>route progress and estimated arrival</Bullet>
                <Bullet>arrival verification</Bullet>
                <Bullet>active booking coordination</Bullet>
                <Bullet>fraud prevention</Bullet>
                <Bullet>operational monitoring</Bullet>
                <Bullet>devotee-facing service status updates</Bullet>
                <Bullet>admin and support visibility during active bookings</Bullet>
              </ul>
              <p className="mt-2">Location may be collected even when the app is closed or not in use, where required for an active booking, live service tracking, route monitoring, or operational coordination.</p>
              <p className="mt-1 font-medium text-orange-700">We do not use location data for advertising.</p>
            </SubSection>

            <SubSection label="E. Voice Call, Video Call, and Communication Data">
              <p>If the app supports voice calls, video calls, or communication-related features, we may collect or process:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>microphone access during calls</Bullet>
                <Bullet>camera access during video calls</Bullet>
                <Bullet>call status and connection events</Bullet>
                <Bullet>caller/callee session metadata</Bullet>
                <Bullet>call timestamps and duration</Bullet>
                <Bullet>communication records, support chats, or service-related conversation details, where applicable</Bullet>
              </ul>
              <p className="mt-2">If you use app-based call features, we may use technologies such as Firebase Cloud Messaging (FCM), notification services, and device-level call UI integrations such as React Native CallKeep to display booking alerts, incoming call interfaces, and call notifications, including when the app is in the background or the device is locked.</p>
            </SubSection>

            <SubSection label="F. Notification and Device Data">
              <p>We may collect:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>FCM push token or device token</Bullet>
                <Bullet>device model</Bullet>
                <Bullet>operating system</Bullet>
                <Bullet>app version</Bullet>
                <Bullet>unique device identifiers</Bullet>
                <Bullet>crash logs</Bullet>
                <Bullet>diagnostics</Bullet>
                <Bullet>performance and network-related information</Bullet>
              </ul>
            </SubSection>

            <SubSection label="G. Uploaded Files and Media">
              <p>If you upload documents, images, certificates, or other files, we may collect and store them for:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>onboarding</Bullet>
                <Bullet>profile verification</Bullet>
                <Bullet>identity confirmation</Bullet>
                <Bullet>support</Bullet>
                <Bullet>service operations</Bullet>
              </ul>
            </SubSection>

          </SectionCard>

          {/* 4. Permissions We May Request */}
          <SectionCard number="4" title="Permissions We May Request">
            <p>Depending on the features you use, the app may request access to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet><span className="font-medium">Precise Location</span></Bullet>
              <Bullet><span className="font-medium">Approximate Location</span></Bullet>
              <Bullet><span className="font-medium">Background Location</span></Bullet>
              <Bullet><span className="font-medium">Camera</span></Bullet>
              <Bullet><span className="font-medium">Microphone</span></Bullet>
              <Bullet><span className="font-medium">Notifications</span></Bullet>
              <Bullet><span className="font-medium">Phone / call handling permissions</span> supported by the operating system</Bullet>
              <Bullet><span className="font-medium">Photos / Media / Files</span>, where uploads are supported</Bullet>
            </ul>
            <p className="mt-3">These permissions are used only for relevant app functions such as:</p>
            <ul className="space-y-1 mt-2">
              <Bullet>booking tracking</Bullet>
              <Bullet>live service coordination</Bullet>
              <Bullet>incoming call UI</Bullet>
              <Bullet>voice calls</Bullet>
              <Bullet>video calls</Bullet>
              <Bullet>booking alerts and notifications</Bullet>
              <Bullet>document uploads</Bullet>
              <Bullet>active booking verification</Bullet>
            </ul>
          </SectionCard>

          {/* 5. How We Use Your Information */}
          <SectionCard number="5" title="How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>create and manage your partner account</Bullet>
              <Bullet>verify identity and onboarding details</Bullet>
              <Bullet>assign and coordinate bookings</Bullet>
              <Bullet>enable live booking tracking</Bullet>
              <Bullet>calculate ETA and arrival status</Bullet>
              <Bullet>allow devotees and operations teams to monitor active service movement</Bullet>
              <Bullet>support in-app voice calls and video calls</Bullet>
              <Bullet>send booking notifications, alerts, and service updates</Bullet>
              <Bullet>process settlements and partner payouts</Bullet>
              <Bullet>prevent fraud, fake attendance, booking manipulation, and misuse</Bullet>
              <Bullet>investigate support issues, complaints, disputes, and service concerns</Bullet>
              <Bullet>monitor service quality and reliability</Bullet>
              <Bullet>improve app performance and partner experience</Bullet>
              <Bullet>comply with legal, tax, accounting, and regulatory obligations</Bullet>
            </ul>
          </SectionCard>

          {/* 6. How We Share Information */}
          <SectionCard number="6" title="How We Share Information">
            <p className="font-semibold text-orange-700">We do not sell your personal data.</p>
            <p className="mt-2">We may share your information only as necessary in the following cases:</p>

            <SubSection label="A. With Devotees / Customers">
              <p>We may share limited information necessary to fulfill a booking, such as:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>your display name or registered name</Bullet>
                <Bullet>profile photo</Bullet>
                <Bullet>service specialization</Bullet>
                <Bullet>language</Bullet>
                <Bullet>booking status</Bullet>
                <Bullet>arrival or live location status</Bullet>
                <Bullet>limited contact details where needed for service coordination</Bullet>
              </ul>
            </SubSection>

            <SubSection label="B. With Internal Operations and Support Teams">
              <p>Authorized staff may access your information for:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>onboarding</Bullet>
                <Bullet>booking assignment</Bullet>
                <Bullet>customer support</Bullet>
                <Bullet>dispute handling</Bullet>
                <Bullet>quality monitoring</Bullet>
                <Bullet>fraud prevention</Bullet>
                <Bullet>partner support</Bullet>
                <Bullet>payout and compliance operations</Bullet>
              </ul>
            </SubSection>

            <SubSection label="C. With Vendors and Service Providers">
              <p>We may share data with third parties that support:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>cloud hosting</Bullet>
                <Bullet>communications</Bullet>
                <Bullet>notifications</Bullet>
                <Bullet>voice/video services</Bullet>
                <Bullet>maps and location services</Bullet>
                <Bullet>analytics and crash reporting</Bullet>
                <Bullet>payment and payout processing</Bullet>
                <Bullet>identity or verification services, where applicable</Bullet>
              </ul>
            </SubSection>

            <SubSection label="D. For Legal and Safety Reasons">
              <p>We may disclose information if required to:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>comply with law or lawful requests</Bullet>
                <Bullet>protect rights, safety, or property</Bullet>
                <Bullet>investigate fraud, abuse, or misuse</Bullet>
                <Bullet>enforce our agreements and policies</Bullet>
              </ul>
            </SubSection>

          </SectionCard>

          {/* 7. Data Retention */}
          <SectionCard number="7" title="Data Retention">
            <p>We retain data only as long as reasonably necessary for:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>active partner operations</Bullet>
              <Bullet>service records</Bullet>
              <Bullet>payouts and accounting</Bullet>
              <Bullet>compliance and tax purposes</Bullet>
              <Bullet>support and dispute resolution</Bullet>
              <Bullet>safety, fraud prevention, and operational audits</Bullet>
            </ul>
            <p className="mt-3">When data is no longer needed, we may delete, anonymize, or securely archive it as required by law or legitimate business needs.</p>
          </SectionCard>

          {/* 8. Data Security */}
          <SectionCard number="8" title="Data Security">
            <p>We use reasonable technical and organizational safeguards to protect data, including:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>role-based access control</Bullet>
              <Bullet>restricted internal access</Bullet>
              <Bullet>secure storage practices</Bullet>
              <Bullet>logging and monitoring</Bullet>
              <Bullet>controlled access to sensitive information</Bullet>
            </ul>
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-amber-800">However, no system is completely secure. You are also responsible for securing your device, OTPs, and account access.</p>
            </div>
          </SectionCard>

          {/* 9. Your Rights and Choices */}
          <SectionCard number="9" title="Your Rights and Choices">
            <p>Subject to applicable law, you may request:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>access to personal data we hold about you</Bullet>
              <Bullet>correction of inaccurate or incomplete data</Bullet>
              <Bullet>deletion of personal data where legally permitted</Bullet>
              <Bullet>withdrawal of consent for certain processing</Bullet>
              <Bullet>grievance redressal</Bullet>
            </ul>
            <p className="mt-3">Please note that if you withdraw consent for data necessary to run core partner features, some or all app functions may stop working.</p>
          </SectionCard>

          {/* 10. Children's Privacy */}
          <SectionCard number="10" title="Children's Privacy">
            <p>This app is intended only for adult pandits, priests, and service partners. It is not intended for children.</p>
          </SectionCard>

          {/* 11. Third-Party Services */}
          <SectionCard number="11" title="Third-Party Services">
            <p>The app may integrate with third-party tools and service providers such as:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>Firebase Cloud Messaging (FCM)</Bullet>
              <Bullet>React Native CallKeep</Bullet>
              <Bullet>voice and video communication services</Bullet>
              <Bullet>maps and location providers</Bullet>
              <Bullet>payment and payout processors</Bullet>
              <Bullet>support systems</Bullet>
              <Bullet>analytics and crash reporting tools</Bullet>
            </ul>
            <p className="mt-3">These services may process data according to their own privacy policies and terms, where applicable.</p>
          </SectionCard>

          {/* 12. Account Deletion and Service Impact */}
          <SectionCard number="12" title="Account Deletion and Service Impact">
            <p>If you request deletion of your account or withdraw consent for certain essential processing, some or all partner features may stop functioning, including:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>booking acceptance</Bullet>
              <Bullet>live tracking</Bullet>
              <Bullet>voice/video calling</Bullet>
              <Bullet>notifications</Bullet>
              <Bullet>service coordination</Bullet>
              <Bullet>payout operations</Bullet>
            </ul>
            <p className="mt-3">We may still retain certain information where required for:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>completed bookings</Bullet>
              <Bullet>payout records</Bullet>
              <Bullet>accounting</Bullet>
              <Bullet>legal compliance</Bullet>
              <Bullet>fraud prevention</Bullet>
              <Bullet>dispute resolution</Bullet>
            </ul>
          </SectionCard>

          {/* 13. Changes to This Privacy Policy */}
          <SectionCard number="13" title="Changes to This Privacy Policy">
            <p>We may update this Privacy Policy from time to time. Changes will be posted with an updated "Last Updated" date.</p>
            <p className="mt-2">Your continued use of the Platform after such updates means you accept the revised Privacy Policy.</p>
          </SectionCard>

          {/* 14. Contact / Grievance Redressal */}
          <SectionCard number="14" title="Contact / Grievance Redressal">
            <p>For privacy questions, complaints, or requests, contact:</p>
            <div className="mt-3 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl px-5 py-4 space-y-1.5">
              <InfoBox>
                <p>📧 Email: panditjiatrequest@vedicvaibhav.com</p>
                <p>📞 Phone: +91 98727 88769</p>
              </InfoBox>
              <div className="pt-2">
                <p className="font-semibold text-stone-800">Registered Office:</p>
                <p>#1031 Tricity Trade Tower,</p>
                <p>Patiala Zirakpur Road,</p>
                <p>Zirakpur, Punjab, India</p>
              </div>
            </div>
          </SectionCard>

          {/* 15. Important App-Specific Disclosure */}
          <SectionCard number="15" title="Important App-Specific Disclosure">
            <p>For clarity, Pandit Ji : Pandit Ji At Req may access or collect the following, depending on enabled features and permissions:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>personal profile and onboarding details</Bullet>
              <Bullet>booking and service data</Bullet>
              <Bullet>approximate, precise, and background location</Bullet>
              <Bullet>microphone data for voice calling</Bullet>
              <Bullet>camera and microphone for video calling</Bullet>
              <Bullet>notification tokens and call alert data</Bullet>
              <Bullet>uploaded files or profile documents</Bullet>
              <Bullet>device and diagnostic information</Bullet>
            </ul>
            <p className="mt-3">These are used only for partner onboarding, booking fulfillment, live tracking, communication, partner support, fraud prevention, quality review, payout handling, and operational management.</p>
          </SectionCard>

        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-orange-50 via-white to-orange-50 border-t-2 border-orange-200/50 mt-12">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center">
            <p className="text-gray-700 font-medium">
              © 2026 Vedic Vaibhav Dot Com Pvt Ltd. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Bringing sacred services to your doorstep with trust and devotion
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}
