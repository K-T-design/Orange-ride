
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
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
                <PolicySection value="item-1" title="1. Introduction">
                    <p>Welcome to Orange Rides. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at <a href="mailto:orangemotorslogistics@gmail.com" className="text-primary hover:underline">orangemotorslogistics@gmail.com</a>.</p>
                    <p>When you visit our website and use our services, you trust us with your personal information. We take your privacy very seriously. In this privacy policy, we seek to explain to you in the clearest way possible what information we collect, how we use it, and what rights you have in relation to it.</p>
                </PolicySection>
                
                <PolicySection value="item-2" title="2. Information We Collect">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Personal Information You Disclose to Us</h3>
                    <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.</p>
                    <p>The personal information that we collect depends on the context of your interactions with us and the website, the choices you make, and the products and features you use. The personal information we collect may include the following: Full Name, Phone Number, Email Address, Business Name (for Ride Owners), and Password.</p>
                    <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Information Automatically Collected</h3>
                    <p>We automatically collect certain information when you visit, use, or navigate the website. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, and other technical information.</p>
                </PolicySection>

                <PolicySection value="item-3" title="3. How We Use Your Information">
                    <p>We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>To facilitate account creation and logon process.</li>
                        <li>To post testimonials on our website with your consent.</li>
                        <li>To send administrative information to you for business purposes, legal reasons, and/or contractual reasons.</li>
                        <li>To manage user accounts. We may use your information for the purposes of managing your account and keeping it in working order.</li>
                        <li>To deliver and facilitate delivery of services to the user.</li>
                    </ul>
                </PolicySection>

                <PolicySection value="item-4" title="4. Sharing and Disclosure">
                    <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
                    <p>Specifically, your contact information (phone, WhatsApp) is shared with a customer only when they explicitly choose to contact you about your ride listing.</p>
                </PolicySection>

                <PolicySection value="item-5" title="5. Data Security">
                    <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
                </PolicySection>

                <PolicySection value="item-6" title="6. Data Retention">
                    <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).</p>
                </PolicySection>

                <PolicySection value="item-7" title="7. Your Rights">
                    <p>You have the right to access, update, or delete your personal information at any time through your account's Profile page. You may review or change the information in your account or terminate your account by logging into your account settings and updating your user account.</p>
                </PolicySection>
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
