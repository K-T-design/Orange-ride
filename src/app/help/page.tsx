
import { FaqAccordion } from "@/components/faq-accordion";

export default function HelpPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Help & Support</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Find answers to your questions about Orange Rides.
        </p>
      </div>

      <FaqAccordion />

    </div>
  );
}
