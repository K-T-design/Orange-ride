
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Eye, Rocket, Search, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getAboutContent() {
    try {
        const aboutUsRef = doc(db, 'siteContent', 'aboutUs');
        const docSnap = await getDoc(aboutUsRef);

        if (docSnap.exists() && docSnap.data().publishedVersion) {
            return docSnap.data().publishedVersion;
        }
    } catch (error) {
        console.error("Error fetching 'About Us' content:", error);
    }

    // Return default content if fetch fails or no data exists
    return {
        mission: "To seamlessly connect people with safe, reliable, and affordable transportation across Nigeria, fostering community and economic empowerment through technology.",
        vision: "To be Nigeria's most trusted and preferred digital transportation marketplace, transforming the way people travel by making it simpler, safer, and more efficient for everyone.",
        values: ["Customer-Centric", "Safety First", "Integrity", "Innovation", "Community"],
        howItWorks: [
            { icon: Search, title: "Search for a Ride", description: "Enter your pickup and destination to browse available vehicles." },
            { icon: CheckCircle, title: "Choose the Best Fit", description: "Compare prices and schedules to find the perfect ride for you." },
            { icon: Rocket, title: "Enjoy Your Trip", description: "Connect with the owner and embark on a smooth journey." },
        ],
        whyChooseUs: ["Wide Range of Options", "Transparent Pricing", "Direct Contact with Owners", "Safety and Reliability"],
    };
}


const StepCard = ({ icon, title, description, step }: { icon: React.ReactNode, title: string, description: string, step: number }) => (
    <div className="relative">
        <div className="absolute -left-4 top-4 text-6xl font-bold text-primary/10 -z-10">{step}</div>
        <Card className="p-6 text-center flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </Card>
    </div>
)


export default async function AboutUsPage() {
    
    const content = await getAboutContent();
    const howItWorksIcons = [Search, CheckCircle, Rocket];

    return (
        <div className="flex flex-col gap-16">
            <section className="bg-muted">
                <div className="container mx-auto px-4 py-20 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">About Orange Rides</h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">We are on a mission to revolutionize transportation in Nigeria, one ride at a time. Discover our story, our values, and why we are passionate about moving you forward.</p>
                </div>
            </section>
            
            <section className="container mx-auto px-4 space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="prose max-w-none">
                        <h2 className="text-3xl font-bold font-headline"><Rocket className="inline-block h-8 w-8 mr-2 text-primary" /> Our Mission</h2>
                        <p className="text-lg">{content.mission}</p>
                    </div>
                    <div className="prose max-w-none">
                         <h2 className="text-3xl font-bold font-headline"><Eye className="inline-block h-8 w-8 mr-2 text-primary" /> Our Vision</h2>
                         <p className="text-lg">{content.vision}</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-bold font-headline text-center mb-8">Our Core Values</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {content.values.map((value: string) => (
                             <Card key={value} className="p-6 text-center">
                                <p className="font-semibold">{value}</p>
                             </Card>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-bold font-headline text-center mb-8">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {content.howItWorks.map((step: string, index: number) => {
                           const Icon = howItWorksIcons[index] || Search;
                           return <StepCard key={index} icon={<Icon className="h-8 w-8" />} title={`Step ${index + 1}`} description={step} step={index + 1} />
                       })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                        <Image src="https://picsum.photos/seed/choose-us/600/400" alt="Why Choose Us" fill className="object-cover" data-ai-hint="city traffic people" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold font-headline mb-4">Why Choose Us?</h2>
                        <ul className="space-y-4">
                            {content.whyChooseUs.map((reason: string) => (
                                <li key={reason} className="flex items-start gap-3">
                                    <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-semibold">{reason}</h4>
                                        <p className="text-muted-foreground text-sm">A brief explanation for why this is a great reason to choose us.</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>
            
            <section className="bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 py-16 text-center">
                    <h2 className="text-3xl font-bold font-headline mb-4">Ready to Start Your Journey?</h2>
                    <p className="max-w-xl mx-auto mb-6">Whether you need a ride or want to become a partner, we're here to help you get moving.</p>
                    <div className="flex justify-center gap-4">
                        <Button variant="secondary" size="lg" asChild>
                            <Link href="/search">Find a Ride</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                             <Link href="/login">Become a Partner</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
