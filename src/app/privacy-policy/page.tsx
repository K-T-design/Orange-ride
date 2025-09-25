
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Our Privacy Policy is being updated and will be available here shortly. We are committed to protecting your personal information and being transparent about how we handle it. Please check back soon for the full policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
