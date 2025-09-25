
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: 'Customer' | 'Ride Owner';
  isActive: boolean;
};

export function FaqAccordion() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
        collection(db, 'faqs'), 
        where('isActive', '==', true),
        orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const faqsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faq));
      setFaqs(faqsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching FAQs:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const customerFaqs = faqs.filter(faq => faq.category === 'Customer');
  const ownerFaqs = faqs.filter(faq => faq.category === 'Ride Owner');

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <div>
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (faqs.length === 0 && !isLoading) {
      return (
          <div className="text-center py-16 text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No FAQs Found</h3>
              <p className="mt-1 text-sm">The help center is currently empty. Please check back later.</p>
          </div>
      )
  }

  return (
    <div className="space-y-12">
      {customerFaqs.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold font-headline mb-4">For Customers</h2>
          <Accordion type="single" collapsible className="w-full">
            {customerFaqs.map(faq => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {ownerFaqs.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold font-headline mb-4">For Ride Owners</h2>
          <Accordion type="single" collapsible className="w-full">
            {ownerFaqs.map(faq => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}
    </div>
  );
}
