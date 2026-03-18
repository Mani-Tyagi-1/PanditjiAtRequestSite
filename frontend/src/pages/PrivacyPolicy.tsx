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

export default function PrivacyPolicy() {
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
                <span className="text-sm font-medium">Your Privacy Matters</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Privacy Policy
              </h1>
              <p className="text-lg text-gray-700 font-medium">Pandit Ji At Request</p>
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
            <p className="font-bold text-orange-800 text-base">Privacy Policy – Pandit Ji At Request</p>
            <p>
              This Privacy Policy describes how Vedic Vaibhav Dot Com Pvt Ltd ("Pandit Ji At Request", "Company", "we", "us", or "our") collects, uses, stores, shares, and protects your personal data when you access or use the Pandit Ji At Request mobile application, website, and related services (collectively, the "Platform").
            </p>
            <p>
              By accessing or using the Platform, creating an account, submitting information, making a booking, or otherwise using our services, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </motion.div>

          {/* 1. Company Details */}
          <SectionCard number="1" title="Company Details">
            <ul className="space-y-1.5 list-none">
              <li><span className="font-medium text-stone-800">Company:</span> Vedic Vaibhav Dot Com Pvt Ltd</li>
              <li><span className="font-medium text-stone-800">Registered Office:</span> #1031 Tricity Trade Tower, Patiala Zirakpur Road, Zirakpur, Punjab, India</li>
              <li><span className="font-medium text-stone-800">Privacy / Support Email:</span> panditjiatrequest@vedicvaibhav.com</li>
              <li><span className="font-medium text-stone-800">Phone:</span> +91 98727 88769</li>
            </ul>
          </SectionCard>

          {/* 2. Scope of This Policy */}
          <SectionCard number="2" title="Scope of This Policy">
            <p>This Privacy Policy applies to personal data collected through:</p>
            <ul className="space-y-1 mt-2">
              <Bullet>the Pandit Ji At Request mobile app,</Bullet>
              <Bullet>the website and landing pages,</Bullet>
              <Bullet>booking forms,</Bullet>
              <Bullet>support channels,</Bullet>
              <Bullet>communications through SMS, WhatsApp, email, calls, or in-app messaging,</Bullet>
              <Bullet>online or offline interactions connected with Platform services.</Bullet>
            </ul>
            <p className="mt-3">This Policy covers data relating to services such as:</p>
            <ul className="space-y-1 mt-2">
              <Bullet>pandit booking,</Bullet>
              <Bullet>puja and ritual services,</Bullet>
              <Bullet>online spiritual consultations or sessions, where offered,</Bullet>
              <Bullet>temple offerings,</Bullet>
              <Bullet>prasad-related services,</Bullet>
              <Bullet>support and service coordination,</Bullet>
              <Bullet>any related spiritual or devotional services listed on the Platform.</Bullet>
            </ul>
          </SectionCard>

          {/* 3. Consent and Legal Basis */}
          <SectionCard number="3" title="Consent and Legal Basis">
            <p>
              We process personal data in accordance with applicable Indian law. Where required, we seek your consent through clear affirmative action, and we also process data where reasonably necessary to provide the services you request, comply with law, prevent fraud, or protect the Platform and its users. Under the DPDP Act, consent must be free, specific, informed, unconditional, and unambiguous, and users must be able to withdraw it; the older SPDI Rules also require notice, purpose limitation, security practices, and grievance handling.
            </p>
            <p className="font-medium text-orange-700">If you do not agree with this Privacy Policy, please do not use the Platform.</p>
          </SectionCard>

          {/* 4. What Personal Data We Collect */}
          <SectionCard number="4" title="What Personal Data We Collect">

            <SubSection label="4.1 Information You Provide Directly">
              <p>We may collect information you give us, including:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>full name,</Bullet>
                <Bullet>mobile number,</Bullet>
                <Bullet>WhatsApp number,</Bullet>
                <Bullet>email address,</Bullet>
                <Bullet>city, address, pin code, and landmark,</Bullet>
                <Bullet>booking date and time preference,</Bullet>
                <Bullet>puja, ritual, service, or consultation selected,</Bullet>
                <Bullet>language preference,</Bullet>
                <Bullet>family details, gotra, sankalp details, or other spiritual/custom details, if you choose to provide them,</Bullet>
                <Bullet>support queries, feedback, complaints, ratings, and reviews,</Bullet>
                <Bullet>any images, recordings, notes, or documents you voluntarily share.</Bullet>
              </ul>
            </SubSection>

            <SubSection label="4.2 Account and Authentication Data">
              <p>When you sign up or log in, we may collect:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>mobile number,</Bullet>
                <Bullet>OTP verification status,</Bullet>
                <Bullet>account identifiers,</Bullet>
                <Bullet>profile preferences,</Bullet>
                <Bullet>referral or promotional code information, where applicable.</Bullet>
              </ul>
            </SubSection>

            <SubSection label="4.3 Payment and Transaction Data">
              <p>Payments may be processed through third-party payment partners such as Razorpay. Razorpay publicly states that buyer payment data is processed under its own privacy notice.</p>
              <p className="mt-2">We may receive and store limited payment-related information such as:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>transaction ID,</Bullet>
                <Bullet>order ID,</Bullet>
                <Bullet>payment status,</Bullet>
                <Bullet>amount,</Bullet>
                <Bullet>timestamp,</Bullet>
                <Bullet>payment method category,</Bullet>
                <Bullet>limited payment metadata required for reconciliation and support.</Bullet>
              </ul>
              <p className="mt-2">We do not intentionally store your full card number, CVV, UPI PIN, or net-banking credentials on our own servers.</p>
            </SubSection>

            <SubSection label="4.4 Automatically Collected Data">
              <p>When you use the Platform, we may automatically collect:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>device type,</Bullet>
                <Bullet>operating system,</Bullet>
                <Bullet>app version,</Bullet>
                <Bullet>unique device identifiers,</Bullet>
                <Bullet>IP address,</Bullet>
                <Bullet>approximate location derived from IP,</Bullet>
                <Bullet>crash logs,</Bullet>
                <Bullet>diagnostics,</Bullet>
                <Bullet>session and usage data,</Bullet>
                <Bullet>app interaction data,</Bullet>
                <Bullet>pages/screens visited,</Bullet>
                <Bullet>clickstream and event information.</Bullet>
              </ul>
            </SubSection>

            <SubSection label="4.5 Location Data">
              <p>We may collect:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>approximate location from IP or coarse device signals, and</Bullet>
                <Bullet>precise location only if you grant the relevant device permission.</Bullet>
              </ul>
              <p className="mt-2">Location data may be used for:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>serviceability checks,</Bullet>
                <Bullet>assigning pandits,</Bullet>
                <Bullet>estimating travel/logistics,</Bullet>
                <Bullet>route coordination,</Bullet>
                <Bullet>improving service delivery.</Bullet>
              </ul>
            </SubSection>

            <SubSection label="4.6 Audio, Video, and Media Data">
              <p>If your use of the Platform includes audio/video consultation, live spiritual sessions, or uploading images/files, we may collect or process:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>camera input,</Bullet>
                <Bullet>microphone input,</Bullet>
                <Bullet>uploaded photos or files,</Bullet>
                <Bullet>in-call technical metadata,</Bullet>
                <Bullet>chat/support attachments.</Bullet>
              </ul>
              <p className="mt-2">We only access such data where necessary for the feature you choose to use and subject to device permissions.</p>
            </SubSection>

            <SubSection label="4.7 Communications Data">
              <p>If you contact us or interact with service providers through the Platform, we may collect:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>call records or call logs relevant to service support,</Bullet>
                <Bullet>support chat transcripts,</Bullet>
                <Bullet>email correspondence,</Bullet>
                <Bullet>WhatsApp/SMS communication content,</Bullet>
                <Bullet>complaint records,</Bullet>
                <Bullet>service follow-up information.</Bullet>
              </ul>
            </SubSection>

          </SectionCard>

          {/* 5. App Permissions */}
          <SectionCard number="5" title="App Permissions">
            <p>Depending on the features you use, the app may request device permissions such as:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet><span className="font-medium">Location</span> – for serviceability and booking coordination,</Bullet>
              <Bullet><span className="font-medium">Notifications</span> – for booking updates and promotional alerts,</Bullet>
              <Bullet><span className="font-medium">Camera</span> – for video sessions or image uploads,</Bullet>
              <Bullet><span className="font-medium">Microphone</span> – for calls or live sessions,</Bullet>
              <Bullet><span className="font-medium">Photos / Media / Files</span> – for uploading images or documents.</Bullet>
            </ul>
            <p className="mt-3">We request permissions only for relevant features. You can generally manage permissions through your device settings. Under OneSignal's published privacy policy, users can usually opt out of push notifications through device notification settings.</p>
          </SectionCard>

          {/* 6. How We Use Your Data */}
          <SectionCard number="6" title="How We Use Your Data">
            <p>We may use your personal data to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>create and manage your account,</Bullet>
              <Bullet>authenticate logins using OTP,</Bullet>
              <Bullet>process and confirm bookings,</Bullet>
              <Bullet>assign and coordinate pandits or service partners,</Bullet>
              <Bullet>verify serviceability,</Bullet>
              <Bullet>provide online or offline spiritual services,</Bullet>
              <Bullet>process payments and refunds,</Bullet>
              <Bullet>send booking confirmations, reminders, invoices, receipts, and updates,</Bullet>
              <Bullet>provide customer support,</Bullet>
              <Bullet>investigate complaints and disputes,</Bullet>
              <Bullet>detect and prevent fraud, abuse, and unauthorized activity,</Bullet>
              <Bullet>improve app performance, reliability, and user experience,</Bullet>
              <Bullet>conduct analytics, internal reporting, and service quality review,</Bullet>
              <Bullet>send promotional offers, festival campaigns, service announcements, and engagement messages where permitted,</Bullet>
              <Bullet>comply with legal, tax, audit, and regulatory obligations,</Bullet>
              <Bullet>enforce our Terms &amp; Conditions and other policies.</Bullet>
            </ul>
          </SectionCard>

          {/* 7. Push Notifications, OneSignal, and Engagement Messaging */}
          <SectionCard number="7" title="Push Notifications, OneSignal, and Engagement Messaging">
            <p>We may use third-party messaging and engagement tools such as OneSignal for push notifications and in-app messaging. OneSignal's public privacy policy states that users can generally opt out through device notification settings.</p>
            <p className="mt-2">For notification and engagement purposes, we may process and/or share information such as:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>push token or device identifier,</Bullet>
              <Bullet>app version and device type,</Bullet>
              <Bullet>language and region preferences,</Bullet>
              <Bullet>notification interaction data,</Bullet>
              <Bullet>user attributes, tags, or segments,</Bullet>
              <Bullet>booking or activity-based messaging preferences.</Bullet>
            </ul>
            <p className="mt-3">We may use such tools to send:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>booking confirmations,</Bullet>
              <Bullet>reminders,</Bullet>
              <Bullet>cancellations or rescheduling alerts,</Bullet>
              <Bullet>support-related updates,</Bullet>
              <Bullet>festival offers,</Bullet>
              <Bullet>re-engagement notifications,</Bullet>
              <Bullet>service recommendations.</Bullet>
            </ul>
            <p className="mt-3">You can disable push notifications from your device settings. Disabling promotional notifications may not stop essential service communications.</p>
          </SectionCard>

          {/* 8. How We Share Personal Data */}
          <SectionCard number="8" title="How We Share Personal Data">
            <p className="font-semibold text-orange-700">We do not sell your personal data.</p>
            <p className="mt-2">We may share your data only as reasonably necessary in the following situations:</p>

            <SubSection label="8.1 With Pandits and Service Providers">
              <p>We may share necessary booking details with the pandit, representative, temple partner, or service provider fulfilling your booking, including:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>your name,</Bullet>
                <Bullet>contact number,</Bullet>
                <Bullet>address/location,</Bullet>
                <Bullet>service type,</Bullet>
                <Bullet>booking schedule,</Bullet>
                <Bullet>special instructions,</Bullet>
                <Bullet>limited ritual/custom details you provide for the service.</Bullet>
              </ul>
            </SubSection>

            <SubSection label="8.2 With Trusted Service Providers">
              <p>We may share data with third-party vendors who help us operate the Platform, such as:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>payment processors,</Bullet>
                <Bullet>cloud hosting and storage providers,</Bullet>
                <Bullet>SMS/WhatsApp/email providers,</Bullet>
                <Bullet>analytics and crash-reporting tools,</Bullet>
                <Bullet>customer support systems,</Bullet>
                <Bullet>notification providers such as OneSignal,</Bullet>
                <Bullet>mapping, geolocation, and communication vendors.</Bullet>
              </ul>
              <p className="mt-2">The 2011 SPDI Rules permit transfer where needed for lawful contract performance or with consent, provided an appropriate level of protection is maintained.</p>
            </SubSection>

            <SubSection label="8.3 For Legal and Safety Reasons">
              <p>We may disclose data if reasonably necessary to:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>comply with legal obligations,</Bullet>
                <Bullet>respond to lawful requests, court orders, or regulatory directions,</Bullet>
                <Bullet>investigate fraud or abuse,</Bullet>
                <Bullet>protect our rights, users, service providers, or the public.</Bullet>
              </ul>
            </SubSection>

            <SubSection label="8.4 Business Transfers">
              <p>If our business is involved in a merger, restructuring, investment, acquisition, or asset transfer, your data may be transferred as part of that transaction, subject to applicable law.</p>
            </SubSection>
          </SectionCard>

          {/* 9. Data Retention */}
          <SectionCard number="9" title="Data Retention">
            <p>We retain personal data only for as long as reasonably necessary for:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>providing services you requested,</Bullet>
              <Bullet>maintaining booking and transaction records,</Bullet>
              <Bullet>customer support and dispute handling,</Bullet>
              <Bullet>legal, tax, accounting, and compliance needs,</Bullet>
              <Bullet>fraud prevention and security monitoring,</Bullet>
              <Bullet>legitimate business records and internal audits.</Bullet>
            </ul>
            <p className="mt-3">The SPDI Rules state information should not be retained longer than required for lawful use, and the DPDP Act contemplates cessation of processing after withdrawal of consent except where retention remains necessary or lawful.</p>
            <p className="mt-2">When no longer needed, we may delete, de-identify, anonymize, or securely archive the data, subject to legal and operational requirements.</p>
          </SectionCard>

          {/* 10. Data Security */}
          <SectionCard number="10" title="Data Security">
            <p>We use reasonable administrative, technical, and organizational safeguards to help protect your data, including:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>access controls,</Bullet>
              <Bullet>role-based access restrictions,</Bullet>
              <Bullet>secure storage practices,</Bullet>
              <Bullet>logging and monitoring,</Bullet>
              <Bullet>security review of key workflows,</Bullet>
              <Bullet>vendor controls where appropriate.</Bullet>
            </ul>
            <p className="mt-3">The 2011 SPDI Rules require reasonable security practices and published privacy/security measures.</p>
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-amber-800">However, no method of transmission over the internet or electronic storage is completely secure. You should also protect your device, OTPs, passwords, and account access.</p>
            </div>
          </SectionCard>

          {/* 11. Your Rights and Choices */}
          <SectionCard number="11" title="Your Rights and Choices">
            <p>Subject to applicable law, you may have the right to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>request access to personal data we hold about you,</Bullet>
              <Bullet>request correction of inaccurate or incomplete data,</Bullet>
              <Bullet>request deletion or erasure of data where legally permissible,</Bullet>
              <Bullet>withdraw consent for processing that is based on consent,</Bullet>
              <Bullet>opt out of promotional communications,</Bullet>
              <Bullet>raise a grievance regarding privacy or data handling.</Bullet>
            </ul>
            <p className="mt-3">The DPDP Act provides for notice, consent withdrawal, and rights-related processes, while the SPDI Rules also require the ability to review/correct information and a published grievance contact.</p>
            <p className="mt-2">To exercise these rights, contact us at:</p>
            <InfoBox>
              <p>📧 Email: panditjiatrequest@vedicvaibhav.com</p>
              <p>📞 Phone: +91 98727 88769</p>
              <p className="text-stone-600 text-xs mt-1">For faster handling, please include your registered phone number or email and, where relevant, your booking ID.</p>
            </InfoBox>
          </SectionCard>

          {/* 12. Grievance Redressal */}
          <SectionCard number="12" title="Grievance Redressal">
            <p>If you have any concern, complaint, or grievance regarding privacy or personal data processing, you may contact us at:</p>
            <InfoBox>
              <p>📧 Grievance / Privacy Contact: panditjiatrequest@vedicvaibhav.com</p>
              <p>📞 Phone: +91 98727 88769</p>
            </InfoBox>
            <p className="mt-3">The SPDI Rules require publishing grievance contact details and addressing grievances in a time-bound manner.</p>
            <p className="mt-1">We will make reasonable efforts to review and respond to privacy-related grievances promptly.</p>
          </SectionCard>

          {/* 13. Marketing Choices */}
          <SectionCard number="13" title="Marketing Choices">
            <p>You may opt out of promotional or marketing communications by:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>using the unsubscribe option, where available,</Bullet>
              <Bullet>changing your notification settings,</Bullet>
              <Bullet>contacting us at panditjiatrequest@vedicvaibhav.com.</Bullet>
            </ul>
            <p className="mt-3">Even if you opt out of marketing messages, we may still send essential communications such as:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>OTPs,</Bullet>
              <Bullet>booking confirmations,</Bullet>
              <Bullet>reminders,</Bullet>
              <Bullet>payment receipts,</Bullet>
              <Bullet>security alerts,</Bullet>
              <Bullet>support updates.</Bullet>
            </ul>
          </SectionCard>

          {/* 14. Children's Privacy */}
          <SectionCard number="14" title="Children's Privacy">
            <p>If the Platform is used by or for minors, such use must be managed by a parent or lawful guardian where required. Under the DPDP Act, a "child" is a person below 18 years of age.</p>
            <p className="mt-2">We do not knowingly seek to process children's personal data in a manner prohibited by applicable law. Where consent from a parent or lawful guardian is required, services may be limited until such requirements are satisfied.</p>
          </SectionCard>

          {/* 15. Third-Party Services and Links */}
          <SectionCard number="15" title="Third-Party Services and Links">
            <p>The Platform may contain links to or integrations with third-party services, including payment gateways, messaging services, map providers, and vendor systems.</p>
            <p className="mt-2">These third parties may have their own privacy policies and terms. For example, Razorpay publishes its own buyer privacy notice, and OneSignal publishes its own privacy policy for notification-related processing.</p>
            <p className="mt-2">We are not responsible for third-party privacy practices except as required by law.</p>
          </SectionCard>

          {/* 16. International Processing and Vendor Transfers */}
          <SectionCard number="16" title="International Processing and Vendor Transfers">
            <p>Some of our vendors, cloud partners, analytics tools, or communication providers may process or store data outside your state or outside India, subject to contractual and security measures we consider reasonable and applicable legal requirements.</p>
            <p className="mt-2">Where data is transferred to third-party processors, we expect them to use appropriate safeguards consistent with the services they provide.</p>
          </SectionCard>

          {/* 17. Account Deletion and Service Impact */}
          <SectionCard number="17" title="Account Deletion and Service Impact">
            <p>If you request deletion of your account or withdraw consent for certain processing, some Platform features may no longer be available to you. The DPDP Act specifically contemplates that a service may stop where consent is withdrawn for processing necessary to provide it.</p>
            <p className="mt-2">Even after deletion requests, we may retain certain data where required for:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>pending bookings,</Bullet>
              <Bullet>completed transactions,</Bullet>
              <Bullet>refunds,</Bullet>
              <Bullet>dispute resolution,</Bullet>
              <Bullet>legal compliance,</Bullet>
              <Bullet>fraud prevention,</Bullet>
              <Bullet>accounting or audit requirements.</Bullet>
            </ul>
          </SectionCard>

          {/* 18. Changes to This Privacy Policy */}
          <SectionCard number="18" title="Changes to This Privacy Policy">
            <p>We may update this Privacy Policy from time to time. When we do, we will revise the Last Updated date and may also provide additional notice where appropriate.</p>
            <p className="mt-2">Your continued use of the Platform after an update means you accept the revised Privacy Policy to the extent permitted by law.</p>
          </SectionCard>

          {/* 19. Contact Us */}
          <SectionCard number="19" title="Contact Us">
            <p>For privacy questions, complaints, rights requests, or support:</p>
            <div className="mt-3 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl px-5 py-4 space-y-1.5">
              <p className="font-semibold text-stone-800">Vedic Vaibhav Dot Com Pvt Ltd</p>
              <p>📧 Email: panditjiatrequest@vedicvaibhav.com</p>
              <p>📞 Phone: +91 98727 88769</p>
              <div className="pt-2 border-t border-orange-100">
                <p className="font-semibold text-stone-800">Registered Office:</p>
                <p>#1031 Tricity Trade Tower,</p>
                <p>Patiala Zirakpur Road,</p>
                <p>Zirakpur, Punjab, India</p>
              </div>
            </div>
          </SectionCard>

          {/* 20. Optional App-Specific Clauses */}
          <SectionCard number="20" title="Optional App-Specific Clauses You Should Keep Only If They Are True">
            <p>Include these only if your app actually uses them:</p>

            <SubSection label="A. Live Video / Audio Sessions">
              <p>"If you use in-app voice or video sessions, we may process call metadata, connection quality data, session timestamps, and any content you voluntarily transmit through those features."</p>
            </SubSection>

            <SubSection label="B. Chat / Messaging">
              <p>"If you use in-app chat, we may store chat messages, attachments, and support transcripts to enable the feature, resolve disputes, and improve support."</p>
            </SubSection>

            <SubSection label="C. Contact Access">
              <p>"If the app asks for access to your contacts for referral, invite, or syncing features, we will request separate device permission and use that access only for that feature."</p>
            </SubSection>

            <SubSection label="D. Gallery / Photo Uploads">
              <p>"If you upload photos or documents for booking, identity support, or issue resolution, we will process those files only for the related service or support purpose."</p>
            </SubSection>
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
