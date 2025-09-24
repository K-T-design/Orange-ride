import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";

// Mock data for listings
const listings = [
  { id: 'L001', type: 'Car', model: 'Toyota Camry', price: 15000, owner: 'John Adebayo', status: 'Approved' },
  { id: 'L002', type: 'VIP', model: 'Mercedes-Benz E-Class', price: 45000, owner: 'Prestige Rides', status: 'Promoted' },
  { id: 'L003', type: 'Bus', model: 'Ford Transit', price: 5000, owner: 'Go-Together', status: 'Pending' },
  { id: 'L004', type: 'Keke', model: 'Bajaj RE', price: 2000, owner: 'Chioma Nwosu', status: 'Approved' },
  { id: 'L005', type: 'Bike', model: 'Gokada Bike', price: 1500, owner: 'Safe Journey Ltd.', status: 'Expired' },
];

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Promoted': return 'default';
        case 'Pending': return 'secondary';
        case 'Expired': return 'destructive';
        default: return 'outline';
    }
}

export default function ManageListingsPage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Manage Listings</h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Listing
                </Button>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>All Listings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vehicle Type</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listings.map((listing) => (
                                <TableRow key={listing.id}>
                                    <TableCell>{listing.type}</TableCell>
                                    <TableCell className="font-medium">{listing.model}</TableCell>
                                    <TableCell>₦{listing.price.toLocaleString()}</TableCell>
                                    <TableCell>{listing.owner}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(listing.status)}>{listing.status}</Badge>
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
                                                <DropdownMenuItem>Approve</DropdownMenuItem>
                                                <DropdownMenuItem>Promote</DropdownMenuItem>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
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