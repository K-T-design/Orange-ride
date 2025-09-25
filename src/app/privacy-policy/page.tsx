
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from '@/components/ui/skeleton';

export default function PrivacyPolicyPage() {
  const [policyContent, setPolicyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const policyRef = doc(db, 'siteContent', 'privacyPolicy');
        const policySnap = await getDoc(policyRef);
        if (policySnap.exists()) {
          const data = policySnap.data();
          setPolicyContent(data.content);
          if (data.publishedAt) {
            setEffectiveDate(data.publishedAt.toDate());
          } else {
            setEffectiveDate(new Date());
          }
        } else {
          setPolicyContent("The privacy policy has not been set yet. Please check back later.");
          setEffectiveDate(new Date());
        }
      } catch (error) {
        console.error("Error fetching privacy policy: ", error);
        setPolicyContent("Could not load the privacy policy at this time. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl py-12">
        <Button asChild variant="outline" className="mb-6">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
        </Button>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Privacy Policy</h1>
        {isLoading ? (
          <Skeleton className="h-6 w-48 mx-auto mt-2" />
        ) : (
          <p className="text-lg text-muted-foreground mt-2">
            Effective Date: {effectiveDate ? effectiveDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}
          </p>
        )}
      </div>
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-full mt-4" />
              <Skeleton className="h-5 w-5/6" />
            </div>
          ) : (
             <div className="prose prose-sm prose-p:text-foreground prose-h1:text-foreground prose-h2:text-foreground prose-h3:text-foreground prose-h4:text-foreground prose-a:text-primary max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {policyContent}
                </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
