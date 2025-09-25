
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";


export default function MessagesPage() {

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Contact Messages</h1>
                <p className="text-muted-foreground">Review and respond to customer inquiries.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Inbox</CardTitle>
                    <CardDescription>Messages from the website contact form.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center py-20 text-muted-foreground">
                        <Mail className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-medium">Message inbox is loading...</h3>
                        <p className="mt-1 text-sm">Please wait while we fetch the messages.</p>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
