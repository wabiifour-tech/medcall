"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Settings,
  MonitorUp,
  MonitorDown,
  Wifi,
  WifiOff,
  Signal,
  SignalLow,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeetingStore, useUserStore } from "@/store";
import { AttendanceButton } from "./attendance-button";

interface MeetingRoomProps {
  meeting: {
    id: string;
    title: string;
    meetingCode: string;
    status: string;
    hostId: string;
    allowAttendance: boolean;
    host: {
      id: string;
      name: string;
    };
  };
  onLeave: () => void;
}

export function MeetingRoom({ meeting, onLeave }: MeetingRoomProps) {
  const {
    localStream,
    setLocalStream,
    isVideoOn,
    isAudioOn,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    networkQuality,
    setNetworkQuality,
    clearMeeting,
  } = useMeetingStore();

  const { id: userId, name: userName, role } = useUserStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Failed to get media devices:", error);
      }
    };

    initMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Simulate network quality monitoring
  useEffect(() => {
    const checkQuality = () => {
      // In production, this would use WebRTC stats
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
      if (connection?.effectiveType) {
        const type = connection.effectiveType;
        if (type === "4g") setNetworkQuality("excellent");
        else if (type === "3g") setNetworkQuality("good");
        else if (type === "2g") setNetworkQuality("poor");
        else setNetworkQuality("critical");
      }
    };

    checkQuality();
    const interval = setInterval(checkQuality, 5000);
    return () => clearInterval(interval);
  }, [setNetworkQuality]);

  // Handle video track
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOn;
      }
    }
  }, [isVideoOn, localStream]);

  // Handle audio track
  useEffect(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioOn;
      }
    }
  }, [isAudioOn, localStream]);

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      toggleScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // Replace video track with screen
      if (localStream && localVideoRef.current) {
        const screenTrack = screenStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];

        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }

        localStream.addTrack(screenTrack);
        localVideoRef.current.srcObject = localStream;

        screenTrack.onended = () => {
          toggleScreenShare();
        };
      }

      toggleScreenShare();
    } catch (error) {
      console.error("Failed to share screen:", error);
    }
  };

  const handleLeave = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    clearMeeting();
    onLeave();
  };

  const getNetworkIcon = () => {
    switch (networkQuality) {
      case "excellent":
        return <Signal className="h-4 w-4 text-green-500" />;
      case "good":
        return <Signal className="h-4 w-4 text-yellow-500" />;
      case "poor":
        return <SignalLow className="h-4 w-4 text-orange-500" />;
      case "critical":
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getNetworkLabel = () => {
    switch (networkQuality) {
      case "excellent":
        return "HD Video";
      case "good":
        return "SD Video";
      case "poor":
        return "Audio Only";
      case "critical":
        return "Low Bandwidth";
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-semibold text-lg truncate max-w-[200px] sm:max-w-none">
            {meeting.title}
          </h1>
          <Badge
            variant="outline"
            className="bg-green-500/20 text-green-400 border-green-500/50"
          >
            LIVE
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            {getNetworkIcon()}
            <span className="text-sm hidden sm:inline">{getNetworkLabel()}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <Users className="h-4 w-4" />
            <span className="text-sm">1</span>
          </div>

          <Badge variant="outline" className="text-gray-300 border-gray-600">
            Code: {meeting.meetingCode}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-auto">
        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Local Video */}
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                "w-full h-full object-cover",
                !isVideoOn && "hidden"
              )}
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {userName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Name badge */}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-sm flex items-center gap-2">
              <span>{userName} (You)</span>
              {!isAudioOn && <MicOff className="h-3 w-3 text-red-400" />}
            </div>
          </div>

          {/* Remote participants would be rendered here */}
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for participants...</p>
            </div>
          </div>
        </div>

        {/* Sidebar - Attendance & Info */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Attendance Section */}
          {role === "STUDENT" && (
            <AttendanceButton
              meetingId={meeting.id}
              meetingTitle={meeting.title}
              allowAttendance={meeting.allowAttendance}
              meetingStatus={meeting.status}
            />
          )}

          {/* Meeting Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">
                Meeting Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Host:</span>
                <span>{meeting.host.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Meeting ID:</span>
                <span className="font-mono">{meeting.meetingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your Role:</span>
                <Badge variant="outline" className="text-xs">
                  {role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Network Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                {getNetworkIcon()}
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Quality:</span>
                  <Badge
                    className={cn(
                      networkQuality === "excellent" && "bg-green-500",
                      networkQuality === "good" && "bg-yellow-500",
                      networkQuality === "poor" && "bg-orange-500",
                      networkQuality === "critical" && "bg-red-500"
                    )}
                  >
                    {networkQuality.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Connection:</span>
                  <span>WebRTC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Video Quality:</span>
                  <span>
                    {networkQuality === "excellent"
                      ? "HD (720p)"
                      : networkQuality === "good"
                      ? "SD (480p)"
                      : networkQuality === "poor"
                      ? "Audio Only"
                      : "Optimizing..."}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Control Bar */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-4">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <Button
            variant={isVideoOn ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
          >
            {isVideoOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={isAudioOn ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
          >
            {isAudioOn ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleLeave}
            className="rounded-full w-14 h-12 sm:w-16 sm:h-14 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          <Button
            variant={isScreenSharing ? "default" : "secondary"}
            size="lg"
            onClick={handleScreenShare}
            className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
          >
            {isScreenSharing ? (
              <MonitorDown className="h-5 w-5" />
            ) : (
              <MonitorUp className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-full w-12 h-12 sm:w-14 sm:h-14 hidden sm:flex"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Audio Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Speaker Volume</label>
                  <span className="text-sm text-muted-foreground">{volume}%</span>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={(v) => setVolume(v[0])}
                  max={100}
                  step={1}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mute All</label>
                <Button
                  variant={isMuted ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={() => setShowSettings(false)}
              >
                Done
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
