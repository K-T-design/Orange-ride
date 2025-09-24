import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";

// Mock data for ride owners
const owners = [
  { id: 'O001', name: 'John Adebayo', contact: '2348012345678', plan: 'Monthly', status: 'Active' },
  { id: 'O002', name: 'City Movers Ltd.', contact: 'contact@citymovers.com', plan: 'Yearly', status: 'Active' },
  { id: 'O003', name: 'Prestige Rides', contact: 'bookings@prestigerides.ng', plan: 'Yearly', status: 'Suspended' },
  { id: 'O004', name: 'Bayo Adekunle', contact: 'bayo@example.com', plan: 'None', status: 'Pending Approval' },
  { id: 'O005', name: 'Chioma Nwosu', contact: '2348056789012', plan: 'Weekly', status: 'Active' },
];

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Suspended': return 'destructive';
        case 'Pending Approval': return 'secondary';
        default: return 'outline';
    }
}

export default function ManageOwnersPage() {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold font-headline">Manage Ride Owners</h1>

             <Card>
                <CardHeader>
                    <CardTitle>All Ride Owners</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact Info</TableHead>
                                <TableHead>Subscription Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {owners.map((owner) => (
                                <TableRow key={owner.id}>
                                    <TableCell className="font-medium">{owner.name}</TableCell>
                                    <TableCell>{owner.contact}</TableCell>
                                    <TableCell>{owner.plan}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(owner.status)}>{owner.status}</Badge>
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
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Approve</DropdownMenuItem>
                                                <DropdownMenuItem>Suspend</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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