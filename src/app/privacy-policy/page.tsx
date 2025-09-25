
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const PolicySection = ({ title, children, value }: { title: string, children: React.ReactNode, value: string }) => (
    <AccordionItem value={value}>
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionContent>
            <div className="space-y-4 text-muted-foreground">
                {children}
            </div>
        </AccordionContent>
    </AccordionItem>
)

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
        <Button asChild variant="outline" className="mb-6">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
        </Button>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">At Orange Rides, your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and services. It applies to all users, including customers, ride owners, and visitors.</p>
            <Accordion type="single" collapsible className="w-full">
                <PolicySection value="item-1" title="1. Information We Collect">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Personal Information:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Full name, email address, phone number.</li>
                        <li>Profile picture and account credentials (passwords).</li>
                        <li>For ride owners: business name, business type, and contact person.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Account Data:</h3>
                     <ul className="list-disc pl-5 space-y-1">
                        <li>Saved rides, notification preferences, and other account settings.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Non-Personal Information:</h3>
                     <ul className="list-disc pl-5 space-y-1">
                        <li>IP address, browser type, device information, and usage data collected via analytics tools.</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Optional Data:</h3>
                     <ul className="list-disc pl-5 space-y-1">
                        <li>Messages sent via in-site notifications or support inquiries.</li>
                    </ul>
                </PolicySection>
                
                <PolicySection value="item-2" title="2. How We Use Your Information">
                    <p>We use your information to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Provide, maintain, and improve the platform.</li>
                        <li>Display ride listings and manage user accounts.</li>
                        <li>Send notifications and updates relevant to your account.</li>
                        <li>Analyze usage trends to enhance user experience.</li>
                        <li>Comply with legal obligations or respond to lawful requests.</li>
                    </ul>
                </PolicySection>

                <PolicySection value="item-3" title="3. Sharing & Disclosure">
                    <p>We respect your privacy and do not sell your personal information. We may share data in the following cases:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Service Providers:</strong> Trusted third parties assisting with hosting, analytics, or customer support (under confidentiality agreements).</li>
                        <li><strong>Legal Obligations:</strong> When required by law or legal processes.</li>
                        <li><strong>Public Listings:</strong> Ride owner business information displayed publicly (business name, contact number) is necessary for platform functionality.</li>
                    </ul>
                </PolicySection>

                <PolicySection value="item-4" title="4. Data Security">
                    <p>We implement reasonable technical and organizational measures to protect your personal data, including encryption and secure storage. However, we cannot guarantee 100% security of information transmitted over the internet, and using our platform is at your own risk.</p>
                </PolicySection>

                <PolicySection value="item-5" title="5. Data Retention">
                    <p>We retain your personal information only as long as necessary for account functionality, legal obligations, or legitimate business purposes.</p>
                </PolicySection>

                <PolicySection value="item-6" title="6. Users’ Rights">
                     <p>You have the right to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Access and update your personal information.</li>
                        <li>Delete your account and associated data (account deletion may be requested via your profile settings).</li>
                        <li>Opt-out of marketing notifications.</li>
                    </ul>
                </PolicySection>
                
                 <PolicySection value="item-7" title="7. Cookies & Tracking">
                    <p>We use cookies to manage sessions, improve user experience, and collect anonymous analytics data. You may disable cookies via your browser, but some features may not function correctly.</p>
                </PolicySection>

                <PolicySection value="item-8" title="8. Third-Party Links">
                    <p>Our platform may contain links to external websites. We are not responsible for the privacy practices or content of third-party sites.</p>
                </PolicySection>

                <PolicySection value="item-9" title="9. Children's Privacy">
                    <p>Orange Rides is not intended for children under the age of 13 (or the local age of consent). We do not knowingly collect personal data from children.</p>
                </PolicySection>

                <PolicySection value="item-10" title="10. Changes to This Privacy Policy">
                    <p>We may update this Privacy Policy occasionally. Any changes will be reflected on this page with an updated effective date. We encourage you to review the policy regularly.</p>
                </PolicySection>

                <PolicySection value="item-11" title="11. Contact Us">
                    <p>For questions, concerns, or requests regarding your privacy, you can contact us at:</p>
                    <ul className="list-none space-y-1">
                        <li><strong>Email:</strong> <a href="mailto:orangemotorslogistics@gmail.com" className="text-primary hover:underline">orangemotorslogistics@gmail.com</a></li>
                        <li><strong>Website Contact Form:</strong> <Link href="/help" className="text-primary hover:underline">Help Center</Link></li>
                    </ul>
                </PolicySection>

            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
