
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Terms of Service</h1>
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
            Our Terms of Service are currently being drafted and will be available here soon. These terms will govern your use of the Orange Rides platform. We appreciate your patience and encourage you to check back shortly for the complete terms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
