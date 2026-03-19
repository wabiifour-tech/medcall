"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Users,
  Clock,
  MoreVertical,
  Play,
  Square,
  Eye,
  Trash2,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { useUserStore } from "@/store";
import { formatDate, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Meeting {
  id: string;
  title: string;
  meetingCode: string;
  status: string;
  startTime: Date;
  endTime: Date | null;
  attendanceCount: number;
}

interface AttendanceRecord {
  id: string;
  signInTime: Date;
  status: string;
  student: {
    id: string;
    name: string;
    matricNumber: string;
  };
}

export function HostDashboard() {
  const { id: hostId } = useUserStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Fetch meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!hostId) return;

      try {
        const res = await fetch(`/api/meetings/host?hostId=${hostId}`);
        const data = await res.json();

        if (data.success) {
          setMeetings(data.meetings);
        }
      } catch (error) {
        console.error("Failed to fetch meetings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, [hostId]);

  // Fetch attendance for selected meeting
  const fetchAttendance = async (meetingId: string) => {
    setIsLoadingAttendance(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      const data = await res.json();

      if (data.success) {
        setAttendance(data.meeting.attendances);
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handleViewAttendance = (meeting: { id: string; title: string }) => {
    setSelectedMeeting(meeting);
    fetchAttendance(meeting.id);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ENDED",
          hostId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMeetings((prev) =>
          prev.map((m) =>
            m.id === meetingId ? { ...m, status: "ENDED" } : m
          )
        );
      }
    } catch (error) {
      console.error("Failed to end meeting:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <span className="mr-1 h-2 w-2 rounded-full bg-white animate-pulse" />
            Live
          </Badge>
        );
      case "SCHEDULED":
        return <Badge variant="outline">Scheduled</Badge>;
      case "ENDED":
        return <Badge variant="secondary">Ended</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Meetings</h2>
          <p className="text-muted-foreground">
            Manage your classes and view attendance records
          </p>
        </div>
      </div>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
            <p className="text-muted-foreground">
              Create your first meeting to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {meeting.meetingCode}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyCode(meeting.meetingCode)}
                        >
                          {copied === meeting.meetingCode ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDate(meeting.startTime)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{meeting.attendanceCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleViewAttendance({
                                id: meeting.id,
                                title: meeting.title,
                              })
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Attendance
                          </DropdownMenuItem>
                          {meeting.status === "LIVE" && (
                            <DropdownMenuItem
                              onClick={() => handleEndMeeting(meeting.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Square className="mr-2 h-4 w-4" />
                              End Meeting
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Attendance Dialog */}
      <Dialog
        open={!!selectedMeeting}
        onOpenChange={() => setSelectedMeeting(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Attendance Records</DialogTitle>
            <DialogDescription>
              {selectedMeeting?.title} - {attendance.length} students signed in
            </DialogDescription>
          </DialogHeader>

          {isLoadingAttendance ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No attendance records yet
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Matric Number</TableHead>
                    <TableHead>Sign-in Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record, index) => (
                    <TableRow key={record.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {record.student.name}
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {record.student.matricNumber}
                        </code>
                      </TableCell>
                      <TableCell>{formatDate(record.signInTime)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            record.status === "PRESENT" &&
                              "border-green-500 text-green-600",
                            record.status === "LATE" &&
                              "border-orange-500 text-orange-600"
                          )}
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
