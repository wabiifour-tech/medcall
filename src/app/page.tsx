"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Users,
  Wifi,
  Shield,
  Smartphone,
  Clock,
  WifiOff,
  Home as HomeIcon,
  History,
  LayoutDashboard,
} from "lucide-react";
import { useUserStore, useUIStore } from "@/store";
import { AuthModal } from "@/components/medcall/auth-modal";
import { CreateMeetingDialog } from "@/components/medcall/create-meeting-dialog";
import { JoinMeetingDialog } from "@/components/medcall/join-meeting-dialog";
import { MeetingRoom } from "@/components/medcall/meeting-room";
import { UserMenu } from "@/components/medcall/user-menu";
import { HostDashboard } from "@/components/medcall/host-dashboard";
import { StudentDashboard } from "@/components/medcall/student-dashboard";

export default function Home() {
  const { isAuthenticated, name, role } = useUserStore();
  const { setAuthModal, currentPage, setCurrentPage } = useUIStore();
  const [currentMeeting, setCurrentMeeting] = useState<{
    id: string;
    title: string;
    meetingCode: string;
    status: string;
    hostId: string;
    allowAttendance: boolean;
    host: { id: string; name: string };
  } | null>(null);

  // Monitor online status - use callback for initial value
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Show login modal on first visit if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModal("login");
    }
  }, [isAuthenticated, setAuthModal]);

  // If in meeting, show meeting room
  if (currentMeeting) {
    return (
      <MeetingRoom
        meeting={currentMeeting}
        onLeave={() => setCurrentMeeting(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                MedCall
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resilient Video Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Online Status */}
            <div className="hidden sm:flex items-center gap-2">
              {isOnline ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                >
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Button onClick={() => setAuthModal("login")}>Sign In</Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {isAuthenticated ? (
          <Tabs
            defaultValue="home"
            value={currentPage}
            onValueChange={(v) => setCurrentPage(v as "home" | "history" | "settings")}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="home" className="flex items-center gap-2">
                <HomeIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-6">
              {/* Welcome Section */}
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Welcome back, {name}!
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {role === "HOST"
                    ? "Create a new meeting or manage your existing classes."
                    : "Join a meeting or check your attendance history."}
                </p>
              </section>

              {/* Action Cards */}
              <section className="grid md:grid-cols-2 gap-6">
                {role === "HOST" && (
                  <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-500">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Video className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <CardTitle>Create Meeting</CardTitle>
                      <CardDescription>
                        Start a new class or presentation session
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CreateMeetingDialog
                        onMeetingCreated={(meeting) => setCurrentMeeting(meeting)}
                      />
                    </CardContent>
                  </Card>
                )}

                <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-500">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>Join Meeting</CardTitle>
                    <CardDescription>
                      Enter a meeting code to join a class
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <JoinMeetingDialog
                      onMeetingJoined={(meeting) => setCurrentMeeting(meeting)}
                    />
                  </CardContent>
                </Card>
              </section>

              {/* Quick Stats for Hosts */}
              {role === "HOST" && (
                <section className="grid sm:grid-cols-3 gap-4">
                  <Card className="bg-white/50 dark:bg-slate-800/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Video className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Active Meetings</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/50 dark:bg-slate-800/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Total Students</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/50 dark:bg-slate-800/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <LayoutDashboard className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-sm text-muted-foreground">Total Sessions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Features Section */}
              <section>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Platform Features
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-white/50 dark:bg-slate-800/50">
                    <CardContent className="pt-6">
                      <Wifi className="h-8 w-8 text-teal-600 mb-3" />
                      <h4 className="font-semibold mb-1">Offline-First</h4>
                      <p className="text-sm text-muted-foreground">
                        Works on low bandwidth with adaptive quality
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/50 dark:bg-slate-800/50">
                    <CardContent className="pt-6">
                      <Shield className="h-8 w-8 text-green-600 mb-3" />
                      <h4 className="font-semibold mb-1">Secure Attendance</h4>
                      <p className="text-sm text-muted-foreground">
                        Locked profiles prevent impersonation
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/50 dark:bg-slate-800/50">
                    <CardContent className="pt-6">
                      <Smartphone className="h-8 w-8 text-purple-600 mb-3" />
                      <h4 className="font-semibold mb-1">Cross-Platform</h4>
                      <p className="text-sm text-muted-foreground">
                        Install on any device as a PWA
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/50 dark:bg-slate-800/50">
                    <CardContent className="pt-6">
                      <Clock className="h-8 w-8 text-orange-600 mb-3" />
                      <h4 className="font-semibold mb-1">Time Integrity</h4>
                      <p className="text-sm text-muted-foreground">
                        Server-side timestamps for accurate records
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="history">
              {role === "HOST" ? <HostDashboard /> : <StudentDashboard />}
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Settings page coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Not authenticated view
          <div className="space-y-8">
            {/* Hero Section */}
            <section className="text-center py-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Resilient Video Platform for Education
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
                MedCall is designed for educational environments with offline-first
                architecture, secure attendance tracking, and adaptive video quality.
              </p>
              <div className="flex gap-3 justify-center">
                <Button size="lg" onClick={() => setAuthModal("login")}>
                  Sign In
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setAuthModal("register")}
                >
                  Create Account
                </Button>
              </div>
            </section>

            {/* Features Section */}
            <section>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
                Key Features
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/50 dark:bg-slate-800/50">
                  <CardContent className="pt-6">
                    <Wifi className="h-8 w-8 text-teal-600 mb-3" />
                    <h4 className="font-semibold mb-1">Offline-First</h4>
                    <p className="text-sm text-muted-foreground">
                      Works on low bandwidth with adaptive quality
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-slate-800/50">
                  <CardContent className="pt-6">
                    <Shield className="h-8 w-8 text-green-600 mb-3" />
                    <h4 className="font-semibold mb-1">Secure Attendance</h4>
                    <p className="text-sm text-muted-foreground">
                      Locked profiles prevent impersonation
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-slate-800/50">
                  <CardContent className="pt-6">
                    <Smartphone className="h-8 w-8 text-purple-600 mb-3" />
                    <h4 className="font-semibold mb-1">Cross-Platform</h4>
                    <p className="text-sm text-muted-foreground">
                      Install on any device as a PWA
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-slate-800/50">
                  <CardContent className="pt-6">
                    <Clock className="h-8 w-8 text-orange-600 mb-3" />
                    <h4 className="font-semibold mb-1">Time Integrity</h4>
                    <p className="text-sm text-muted-foreground">
                      Server-side timestamps for accurate records
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* How It Works */}
            <section>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
                How It Works
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      1
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Register Once</h4>
                    <p className="text-sm text-muted-foreground">
                      Create your account with name and matric number. These details
                      are locked after registration to prevent impersonation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      2
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Join Meetings</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter the meeting code provided by your lecturer. Video quality
                      automatically adapts to your network conditions.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      3
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Sign Attendance</h4>
                    <p className="text-sm text-muted-foreground">
                      Click the attendance button during class. Your identity is
                      verified automatically - no input required.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                <Video className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">MedCall</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} MedCall. Built for educational
              environments.
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                PWA Ready
              </Badge>
              <Badge variant="outline" className="text-xs">
                WebRTC
              </Badge>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
}
