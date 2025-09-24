import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";

const subscriptions = [
    { id: 'S001', owner: 'John Adebayo', plan: 'Monthly', price: 30000, startDate: '2024-07-01', expiryDate: '2024-08-01', status: 'Active' },
    { id: 'S002', owner: 'City Movers Ltd.', plan: 'Yearly', price: 120000, startDate: '2024-01-15', expiryDate: '2025-01-15', status: 'Active' },
    { id: 'S003', owner: 'Prestige Rides', plan: 'Yearly', price: 120000, startDate: '2023-10-20', expiryDate: '2024-10-20', status: 'Active' },
    { id: 'S004', owner: 'Go-Together', plan: 'Weekly', price: 10000, startDate: '2024-07-20', expiryDate: '2024-07-27', status: 'Expired' },
    { id: 'S005', owner: 'Chioma Nwosu', plan: 'Weekly', price: 10000, startDate: '2024-07-22', expiryDate: '2024-07-29', status: 'Active' },
];

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Expired': return 'destructive';
        default: return 'outline';
    }
}

export default function ManageSubscriptionsPage() {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold font-headline">Manage Subscriptions</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Owner Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Owner</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.owner}</TableCell>
                                    <TableCell>{sub.plan}</TableCell>
                                    <TableCell>₦{sub.price.toLocaleString()}</TableCell>
                                    <TableCell>{sub.startDate}</TableCell>
                                    <TableCell>{sub.expiryDate}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(sub.status)}>{sub.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Extend</DropdownMenuItem>
                                                <DropdownMenuItem>Upgrade</DropdownMenuItem>
                                                <DropdownMenuItem>Downgrade</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}