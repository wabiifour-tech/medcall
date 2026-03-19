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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Copy, Check } from "lucide-react";
import { useUserStore, useMeetingStore } from "@/store";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateMeetingDialogProps {
  onMeetingCreated: (meeting: {
    id: string;
    title: string;
    meetingCode: string;
    status: string;
    hostId: string;
    allowAttendance: boolean;
    host: { id: string; name: string };
  }) => void;
}

export function CreateMeetingDialog({ onMeetingCreated }: CreateMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<{
    title: string;
    meetingCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { id: hostId } = useUserStore();
  const { setMeeting } = useMeetingStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maxParticipants: "50",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/meetings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          hostId,
          maxParticipants: parseInt(formData.maxParticipants),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create meeting");
      }

      setCreatedMeeting({
        title: data.meeting.title,
        meetingCode: data.meeting.meetingCode,
      });

      // Store meeting in state
      setMeeting({
        id: data.meeting.id,
        title: data.meeting.title,
        meetingCode: data.meeting.meetingCode,
        status: data.meeting.status,
        hostId: hostId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdMeeting) {
      navigator.clipboard.writeText(createdMeeting.meetingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinMeeting = () => {
    if (createdMeeting && hostId) {
      onMeetingCreated({
        id: createdMeeting.meetingCode, // Will be replaced with actual ID
        title: createdMeeting.title,
        meetingCode: createdMeeting.meetingCode,
        status: "LIVE",
        hostId: hostId,
        allowAttendance: true,
        host: { id: hostId, name: "" },
      });
      setOpen(false);
      setCreatedMeeting(null);
      setFormData({ title: "", description: "", maxParticipants: "50" });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setCreatedMeeting(null);
    setFormData({ title: "", description: "", maxParticipants: "50" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {createdMeeting ? "Meeting Created!" : "Create New Meeting"}
          </DialogTitle>
          <DialogDescription>
            {createdMeeting
              ? "Share the code with your students"
              : "Set up a new meeting for your class"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {createdMeeting ? (
          <div className="space-y-6">
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Meeting Code</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-mono font-bold tracking-wider">
                  {createdMeeting.meetingCode}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="h-8 w-8"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {createdMeeting.title}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button onClick={handleJoinMeeting} className="flex-1">
                Start Meeting
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="e.g., CSC 301 - Data Structures"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the meeting..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Select
                value={formData.maxParticipants}
                onValueChange={(v) =>
                  setFormData({ ...formData, maxParticipants: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 participants</SelectItem>
                  <SelectItem value="50">50 participants</SelectItem>
                  <SelectItem value="100">100 participants</SelectItem>
                  <SelectItem value="200">200 participants</SelectItem>
                </SelectContent>
              </Select>
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
                    Creating...
                  </>
                ) : (
                  "Create Meeting"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
