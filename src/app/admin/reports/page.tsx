import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";

const reports = [
    { id: 'R001', listingId: 'L007', reason: 'Unsafe Driving', reporter: 'user@test.com', status: 'New' },
    { id: 'R002', listingId: 'L015', reason: 'Incorrect Pricing', reporter: 'another@test.com', status: 'Investigating' },
    { id: 'R003', listingId: 'L021', reason: 'Vehicle not as described', reporter: 'test@user.com', status: 'Resolved' },
];

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'New': return 'destructive';
        case 'Investigating': return 'secondary';
        case 'Resolved': return 'default';
        default: return 'outline';
    }
}


export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold font-headline">Reports & Moderation</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Flagged Rides</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Listing ID</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Reported By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.listingId}</TableCell>
                                    <TableCell>{report.reason}</TableCell>
                                    <TableCell>{report.reporter}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
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
                                                <DropdownMenuItem>Investigate</DropdownMenuItem>
                                                <DropdownMenuItem>Remove Listing</DropdownMenuItem>
                                                <DropdownMenuItem>Ignore Report</DropdownMenuItem>
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