
const company = {
  name: "Pandit Ji At Request",
  subtitle: "A Vedic Vaibhav Initiative",
  logo: "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/Pandit%20ji%20at%20request/Group%201000005116%201.png", // use your logo
  heroBg:
    "https://vedic-vaibhav.blr1.cdn.digitaloceanspaces.com/vedic-vaibhav/bg/panditji-hero-bg.jpg", // change as needed
};

const TermsAndConditions = () => {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-white min-h-screen pb-8">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-center text-center py-10 px-4"
        style={{
          backgroundImage: `url(${company.heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-yellow-50/80 backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center">
          <img
            src={company.logo}
            alt={company.name}
            className="h-20 mb-4 drop-shadow-xl"
          />
          <h1 className="font-extrabold text-3xl md:text-4xl text-orange-900 drop-shadow mb-2">
            Terms & Conditions
          </h1>
          <div className="text-lg text-orange-800 font-semibold mb-1">
            {company.subtitle}
          </div>
          <p className="text-sm text-orange-700">
            Last Updated: 16 January 2026
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 mt-2 bg-white/70 rounded-xl shadow-lg py-2">
        <div className="prose prose-orange prose-sm sm:prose-base max-w-none font-[Merriweather,serif] text-[1.07rem] leading-relaxed">
          <h2 className="mb-4">Terms & Conditions / Terms of Use ({company.name})</h2>
<pre className="whitespace-pre-wrap font-sans !bg-transparent !p-0 !m-0 !text-inherit !shadow-none">
{`
These Terms & Conditions (“Terms”) govern your access to and use of the Pandit Ji At Request website/app/platform (the “Platform”) and the services offered through it. By accessing or using the Platform, creating an account, or placing any booking/order, you agree to be bound by these Terms, our Privacy Policy, and any additional policies/notices displayed on the Platform for specific services.
If you do not agree, you must not use the Platform.

1) Website Owner / Company Details
The Website Owner, including subsidiaries and affiliates (“Pandit Ji At Request” or “we” or “us” or “our”) refers to:
Vedic Vaibhav Dot Com Pvt Ltd
Registered Office: # 1031 Tricity Trade Tower, Patiala Zirakpur Road, Zirakpur, Punjab, India
Support Email: panditjiatrequest@vedicvaibhav.com
Support Phone: +91 98727 88769

2) Definitions
“Platform” means the Pandit Ji At Request website, mobile apps, and related URLs/pages.
“User / You” means any person who accesses the Platform or book a service/order.
“Company / We / Us / Our” means Vedic Vaibhav Dot Com Pvt Ltd, owner/operator of the Platform.
“Pandit” means a priest/service provider available through the Platform/network.
“Services” include (but are not limited to) puja, path, havan/homam, abhishek, sankalp, temple offerings, prasad-related services, and other spiritual/ritual services listed on the Platform.
“Booking” means a confirmed request for a Service through the Platform.
“Fee” means the amount payable for Services, including applicable taxes/charges.

3) Acceptance & Eligibility
This is a legally binding agreement between you and the Company.
By using the Platform, you confirm you are competent to contract under applicable law.
If you are using the Platform on behalf of someone else, you confirm you have authority to accept these Terms on their behalf.

4) Nature of Services (Important)
The Services (such as puja, path, havan/homam, abhishek, etc.) are performed as requested by you through our network of Pandits/representatives, before or after payment as applicable and as displayed at the time of booking.
The Fee shown on the Platform generally includes:
cost of materials/samagri required for the ritual (unless stated otherwise),
charges paid to the Pandit/representative for performing the Service,
coordination/platform charges, and
applicable taxes/fees (as shown at checkout).
No Donation Solicitation: We do not solicit “donations/chanda/chadhawa” in the name of the Company. Payments made on the Platform are for Services and related costs as displayed. If someone misrepresents the Company to collect money, please report it immediately to panditjiatrequest@vedicvaibhav.com.

5) Booking, Scheduling & Confirmation
A Booking is considered confirmed only after:
successful payment (unless a specific service allows pay-later), and
confirmation status/message on the Platform/WhatsApp/SMS/email (as applicable).
You must provide accurate details including name, phone number, location/address (if required), date/time preference, gotra/family details if applicable, and special instructions.
If the requested slot/pandit is unavailable, we may:
propose an alternate slot/pandit, or
cancel and refund (if eligible) as per Section 9.

6) Temple Visits & Offerings Authorization
By placing a Booking that requires temple visit/temple offerings, you expressly authorize us (and our assigned representatives) to visit the temple/venue on your behalf and perform the requested ritual/offerings as per the Booking details.
Unless explicitly stated, we are not an authorized agent appointed by any temple authority. We co-ordinate services through our own network.

7) Pandit Ji as Independent Service Providers
Pandit Ji’s/priests available on the Platform may be independent service providers. The Platform primarily acts as a coordination/booking interface.
We may help resolve issues, but we are not liable for disputes arising directly between a User and a PanditJi, except as required by law.
Language disclaimer: Languages shown on the Platform refer only to the language in which the Pandit Ji can communicate during the Service. They do not indicate or guarantee the Pandit Ji's mother tongue, birthplace, community/region, training lineage, or style.

8) Payments (Razorpay)
Payments are processed via Razorpay (third-party payment gateway).
By making a payment, you agree to Razorpay’s terms and applicable bank/card/UPI rules.
We do not store your complete card details. Payment processing is handled by Razorpay and your bank/payment provider.
If a payment is debited but the Booking is not created/updated, it may take time to reconcile. If our system confirms failure, refunds (if eligible) will be initiated as per Section 9.

9) Cancellation, Rescheduling & Refund Policy
Refund eligibility depends on service type, material procurement, pandit Ji allocation, and time left before the scheduled service. Service-specific rules shown at booking time will apply.
9.1 Rescheduling
Rescheduling requests are subject to availability and must be made within the timelines shown on the Platform or at least 24 hours before the scheduled time (unless a service specifies different timelines).
9.2 Cancellation by User
If you cancel within the allowed window, refund may be issued after deducting:
payment gateway charges (if applicable),
already-procured material/logistics costs, and
coordination/service charges (if applicable).
Late cancellations may be non-refundable where allocation/material procurement has already occurred.
9.3 Non-Responsive Customer Policy
If you fail to answer calls/respond to messages/emails needed for coordination by the end of working hours on the day before the scheduled Service, we reserve the right to:
cancel the Booking, and
treat the payment as non-refundable, due to operational loss and confirmed allocation.
9.4 Force Majeure / Unavoidable Delays
We are not liable for delays/cancellations caused by events beyond reasonable control such as:
natural disasters, heavy rain/floods, traffic disruptions, strikes, curfews, government orders, power/internet outages, health emergencies, or accidents.
In such cases, we may offer rescheduling or partial/eligible refund depending on costs incurred.
9.5 Refund Processing Time
Approved refunds are typically initiated within 5–10 business days (may vary based on Razorpay/bank processing).
Refunds are made to the original payment method wherever possible.

10) Service Quality, Variations & Substitutions
Ritual procedures may have minor variations depending on regional traditions, availability of materials, and the Pandit Ji’s method, while maintaining the core intent of the ritual.
If any physical items are involved (e.g., prasad/flowers/yantra/puja items), product images and specifications are indicative; minor variations may occur due to availability, craftsmanship, or logistics.

11) No Guarantee of Outcomes
Spiritual/ritual services are based on traditional practices and beliefs. Outcomes/benefits can vary person-to-person. We do not promise or guarantee specific results.

12) Astrology / Consultation Disclaimer (If Offered)
If the Platform offers astrology/vaastu/spiritual guidance:
it is for general guidance only and should not replace professional advice from doctors, lawyers, mental health professionals, or financial advisors.
We do not provide medical/legal/financial treatment or guarantees.

13) Content & Website Disclaimer
Platform content is for general information and may change without notice.
We do not guarantee accuracy, completeness, timeliness, or suitability of any information/material on the Platform to the fullest extent permitted by law.
Your use of the Platform and reliance on its content is at your own risk.

14) Intellectual Property
All content on the Platform (text, logos, UI, design, graphics, images, and software) is owned by or licensed to Vedic Vaibhav Dot Com Pvt Ltd.
Reproduction, copying, redistribution, reverse engineering, or commercial exploitation without written permission is prohibited.
Unauthorized use may lead to civil/criminal action.

15) Prohibited Use
You agree not to:
misuse the Platform, attempt unauthorized access, scrape data, disrupt services, or introduce malware,
submit false booking details or impersonate others,
harass/abuse Pandit Ji’s or staff,
use the Platform for unlawful purposes.
We may suspend/terminate accounts for violations.

16) Third-Party Links
The Platform may contain links to third-party websites/services. These are provided for convenience. We do not endorse and are not responsible for their content, policies, or practices.

17) Cookies
We may use cookies and similar technologies to improve Platform functionality and user experience. By using the Platform, you consent to such use.

18) Disclaimer of Warranties
The Platform and Services are provided on an “as is” and “as available” basis. To the maximum extent permitted by law, we disclaim all warranties (express or implied), including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant uninterrupted, error-free, or fully secure operation.

19) Limitation of Liability
To the maximum extent permitted by law, Vedic Vaibhav Dot Com Pvt Ltd shall not be liable for:
indirect/incidental/special/consequential damages,
loss of profits, data, goodwill, or business opportunities,
delays, force majeure events, or outcome variations,
actions/omissions of third parties (including Pandits/vendors/logistics partners), except as required by law.
If liability is imposed, it shall not exceed the amount paid by you for the specific Booking giving rise to the claim.

20) Indemnity
You agree to indemnify and hold harmless the Company, its directors, employees, affiliates, and partners from claims arising out of:
your misuse of the Platform,
your breach of these Terms, or
your violation of law/third-party rights.

21) Termination & Suspension
We may suspend or terminate your access for violations, fraud, abuse, misuse of payment systems, or legal compliance requirements.

22) Governing Law, Arbitration & Jurisdiction
These Terms are governed by the laws of India.
Disputes should be resolved first through arbitration under the Arbitration and Conciliation Act, 1996, unless prohibited by law.
If court intervention is required, jurisdiction shall lie with the competent courts of Mohali, Punjab, India.

23) Changes to Terms
We may update these Terms from time to time. Updated Terms will be posted on the Platform with a revised “Last Updated” date. Continued use means acceptance of the updated Terms.

24) Contact
For support or legal queries:
panditjiatrequest@vedicvaibhav.com | +91 98727 88769
`}
</pre>
        </div>
      </main>
      {/* subtle footer */}
      <footer className="mt-10 text-center text-sm text-orange-900/70 font-semibold">
        © 2026 {company.name} | A Vedic Vaibhav Company
      </footer>
    </div>
  );
};

export default TermsAndConditions;
