"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Users, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useUserStore } from "@/store";
import { formatDate } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  signInTime: Date;
  status: string;
  meeting: {
    id: string;
    title: string;
    meetingCode: string;
    startTime: Date;
    status: string;
    host: {
      name: string;
    };
  };
}

export function StudentDashboard() {
  const { id: studentId, name } = useUserStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
  });

  // Fetch attendance history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!studentId) return;

      try {
        // In a real app, this would be a dedicated API endpoint
        // For now, we'll use a mock
        setRecords([]);
        setStats({ total: 0, present: 0, late: 0 });
      } catch (error) {
        console.error("Failed to fetch attendance history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Your Attendance History</h2>
        <p className="text-muted-foreground">
          View your class attendance records
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.late}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records Table */}
      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No attendance records</h3>
            <p className="text-muted-foreground">
              Join a meeting and sign attendance to see your records here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your attendance history for recent classes</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Sign-in Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Code: {record.meeting.meetingCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{record.meeting.host.name}</TableCell>
                      <TableCell>{formatDate(record.meeting.startTime)}</TableCell>
                      <TableCell>{formatDate(record.signInTime)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            record.status === "PRESENT"
                              ? "border-green-500 text-green-600"
                              : "border-orange-500 text-orange-600"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
