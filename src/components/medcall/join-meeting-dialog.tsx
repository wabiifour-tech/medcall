"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn } from "lucide-react";
import { useUserStore, useMeetingStore } from "@/store";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface JoinMeetingDialogProps {
  onMeetingJoined: (meeting: {
    id: string;
    title: string;
    meetingCode: string;
    status: string;
    hostId: string;
    allowAttendance: boolean;
    host: { id: string; name: string };
  }) => void;
}

export function JoinMeetingDialog({ onMeetingJoined }: JoinMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingCode, setMeetingCode] = useState("");

  const { id: userId } = useUserStore();
  const { setMeeting } = useMeetingStore();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/meetings/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingCode: meetingCode.toUpperCase(),
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join meeting");
      }

      // Store meeting in state
      setMeeting({
        id: data.meeting.id,
        title: data.meeting.title,
        meetingCode: data.meeting.meetingCode,
        status: data.meeting.status,
        hostId: data.meeting.hostId,
      });

      onMeetingJoined(data.meeting);
      setOpen(false);
      setMeetingCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join meeting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setMeetingCode("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <LogIn className="mr-2 h-4 w-4" />
          Join Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Meeting</DialogTitle>
          <DialogDescription>
            Enter the meeting code provided by your host
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetingCode">Meeting Code</Label>
            <Input
              id="meetingCode"
              placeholder="Enter 8-character code"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="text-center text-xl font-mono tracking-widest"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Meeting"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
