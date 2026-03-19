"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Loader2,
  WifiOff,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import { useUserStore, useAttendanceStore } from "@/store";
import { formatDate, cn } from "@/lib/utils";

interface AttendanceButtonProps {
  meetingId: string;
  meetingTitle: string;
  allowAttendance: boolean;
  meetingStatus: string;
}

export function AttendanceButton({
  meetingId,
  meetingTitle,
  allowAttendance,
  meetingStatus,
}: AttendanceButtonProps) {
  const { id: studentId, name, matricNumber } = useUserStore();
  const { addSignedMeeting, isMeetingSigned, addPendingSync, signedMeetings } =
    useAttendanceStore();

  const [status, setStatus] = useState<
    "idle" | "checking" | "signed" | "signing" | "error"
  >("checking");
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<{
    signInTime: Date;
    status: string;
  } | null>(null);

  // Check if already signed
  const checkAttendance = useCallback(async () => {
    if (!studentId || !meetingId) return;

    setStatus("checking");

    // First check local storage for offline-signed meetings
    if (isMeetingSigned(meetingId)) {
      setStatus("signed");
      return;
    }

    try {
      const res = await fetch(
        `/api/attendance?meetingId=${meetingId}&studentId=${studentId}`
      );
      const data = await res.json();

      if (data.success && data.hasSigned) {
        setStatus("signed");
        setAttendanceData({
          signInTime: new Date(data.attendance.signInTime),
          status: data.attendance.status,
        });
        addSignedMeeting(meetingId);
      } else {
        setStatus("idle");
      }
    } catch {
      // Network error - check offline state
      if (isMeetingSigned(meetingId)) {
        setStatus("signed");
      } else {
        setStatus("idle");
      }
    }
  }, [studentId, meetingId, isMeetingSigned, addSignedMeeting]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check attendance on mount
  useEffect(() => {
    checkAttendance();
  }, [checkAttendance]);

  // Sync offline attendance when back online
  useEffect(() => {
    const syncOfflineAttendance = async () => {
      if (!isOnline || !studentId) return;

      const pendingSyncs = useAttendanceStore.getState().pendingSyncs;
      if (pendingSyncs.length === 0) return;

      try {
        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: pendingSyncs }),
        });

        const data = await res.json();

        if (data.success) {
          // Clear synced records
          data.results.forEach((result: { id: string; success: boolean }) => {
            if (result.success) {
              useAttendanceStore.getState().removePendingSync(result.id);
            }
          });
        }
      } catch (err) {
        console.error("Failed to sync offline attendance:", err);
      }
    };

    if (isOnline) {
      syncOfflineAttendance();
    }
  }, [isOnline, studentId]);

  // Sign attendance - CRITICAL SECURITY LOGIC
  const handleSignAttendance = async () => {
    if (!studentId) {
      setError("You must be logged in to sign attendance");
      return;
    }

    setStatus("signing");
    setError(null);

    const timestamp = Date.now();

    if (!isOnline) {
      // OFFLINE MODE - Store locally for later sync
      addPendingSync({
        meetingId,
        studentId,
        timestamp,
      });
      addSignedMeeting(meetingId);
      setStatus("signed");
      setAttendanceData({
        signInTime: new Date(timestamp),
        status: "PRESENT",
      });
      return;
    }

    // ONLINE MODE - Send to server
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          studentId,
          timestamp,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Already signed - duplicate prevented
        setStatus("signed");
        setAttendanceData({
          signInTime: new Date(data.attendance.signInTime),
          status: data.attendance.status,
        });
        addSignedMeeting(meetingId);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign attendance");
      }

      setStatus("signed");
      setAttendanceData({
        signInTime: new Date(data.attendance.signInTime),
        status: data.attendance.status,
      });
      addSignedMeeting(meetingId);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to sign attendance");
    }
  };

  // Don't show if attendance is disabled
  if (!allowAttendance) {
    return null;
  }

  // Don't show if meeting is not live
  if (meetingStatus !== "LIVE") {
    return null;
  }

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{meetingTitle}</h3>
            <p className="text-sm text-muted-foreground">
              Signing as: <span className="font-medium">{name}</span> (
              {matricNumber})
            </p>
            {!isOnline && (
              <Badge variant="outline" className="mt-2 gap-1">
                <WifiOff className="h-3 w-3" />
                Offline Mode
              </Badge>
            )}
          </div>

          <div className="w-full sm:w-auto">
            {status === "checking" && (
              <Button disabled className="w-full sm:w-auto">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </Button>
            )}

            {status === "idle" && (
              <Button
                onClick={handleSignAttendance}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Sign Attendance
              </Button>
            )}

            {status === "signing" && (
              <Button disabled className="w-full sm:w-auto">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing...
              </Button>
            )}

            {status === "signed" && (
              <div className="flex flex-col gap-2">
                <Button
                  disabled
                  className="w-full sm:w-auto bg-green-600 cursor-not-allowed"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Attendance Completed
                </Button>
                {attendanceData && (
                  <p className="text-xs text-muted-foreground text-center">
                    Signed at: {formatDate(attendanceData.signInTime)}
                    {attendanceData.status === "LATE" && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-orange-600 border-orange-600"
                      >
                        Late
                      </Badge>
                    )}
                  </p>
                )}
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSignAttendance}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                {error && (
                  <p className="text-xs text-destructive text-center">{error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
