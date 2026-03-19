import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// User state
interface UserState {
  id: string | null;
  name: string | null;
  matricNumber: string | null;
  role: "STUDENT" | "HOST" | "ADMIN" | null;
  profileLocked: boolean;
  isAuthenticated: boolean;
  setUser: (user: {
    id: string;
    name: string;
    matricNumber: string;
    role: string;
    profileLocked: boolean;
  }) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      id: null,
      name: null,
      matricNumber: null,
      role: null,
      profileLocked: false,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          id: user.id,
          name: user.name,
          matricNumber: user.matricNumber,
          role: user.role as UserState["role"],
          profileLocked: user.profileLocked,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          id: null,
          name: null,
          matricNumber: null,
          role: null,
          profileLocked: false,
          isAuthenticated: false,
        }),
    }),
    {
      name: "medcall-user",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Meeting state
interface Participant {
  id: string;
  name: string;
  video: boolean;
  audio: boolean;
}

interface MeetingState {
  currentMeeting: {
    id: string;
    title: string;
    meetingCode: string;
    status: string;
    hostId: string;
  } | null;
  participants: Map<string, Participant>;
  localStream: MediaStream | null;
  networkQuality: "excellent" | "good" | "poor" | "critical";
  connectionType: "LOCAL_P2P" | "REMOTE_SFU" | "HYBRID";
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  setMeeting: (meeting: MeetingState["currentMeeting"]) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setNetworkQuality: (quality: MeetingState["networkQuality"]) => void;
  setConnectionType: (type: MeetingState["connectionType"]) => void;
  addParticipant: (id: string, data: Omit<Participant, "id">) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, data: Partial<Omit<Participant, "id">>) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleScreenShare: () => void;
  clearMeeting: () => void;
}

export const useMeetingStore = create<MeetingState>()((set, get) => ({
  currentMeeting: null,
  participants: new Map(),
  localStream: null,
  networkQuality: "excellent",
  connectionType: "REMOTE_SFU",
  isVideoOn: true,
  isAudioOn: true,
  isScreenSharing: false,
  setMeeting: (meeting) => set({ currentMeeting: meeting }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setNetworkQuality: (quality) => set({ networkQuality: quality }),
  setConnectionType: (type) => set({ connectionType: type }),
  addParticipant: (id, data) =>
    set((state) => {
      const newParticipants = new Map(state.participants);
      newParticipants.set(id, { id, ...data });
      return { participants: newParticipants };
    }),
  removeParticipant: (id) =>
    set((state) => {
      const newParticipants = new Map(state.participants);
      newParticipants.delete(id);
      return { participants: newParticipants };
    }),
  updateParticipant: (id, data) =>
    set((state) => {
      const newParticipants = new Map(state.participants);
      const participant = newParticipants.get(id);
      if (participant) {
        newParticipants.set(id, { ...participant, ...data });
      }
      return { participants: newParticipants };
    }),
  toggleVideo: () => set((state) => ({ isVideoOn: !state.isVideoOn })),
  toggleAudio: () => set((state) => ({ isAudioOn: !state.isAudioOn })),
  toggleScreenShare: () => set((state) => ({ isScreenSharing: !state.isScreenSharing })),
  clearMeeting: () =>
    set({
      currentMeeting: null,
      participants: new Map(),
      localStream: null,
      networkQuality: "excellent",
      connectionType: "REMOTE_SFU",
      isVideoOn: true,
      isAudioOn: true,
      isScreenSharing: false,
    }),
}));

// Attendance state for offline sync
interface OfflineAttendance {
  id: string;
  meetingId: string;
  studentId: string;
  timestamp: number;
  synced: boolean;
}

interface AttendanceState {
  pendingSyncs: OfflineAttendance[];
  addPendingSync: (attendance: Omit<OfflineAttendance, "id" | "synced">) => void;
  markSynced: (id: string) => void;
  removePendingSync: (id: string) => void;
  signedMeetings: string[];
  addSignedMeeting: (meetingId: string) => void;
  isMeetingSigned: (meetingId: string) => boolean;
  clearPendingSyncs: () => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      pendingSyncs: [],
      signedMeetings: [],
      addPendingSync: (attendance) =>
        set((state) => ({
          pendingSyncs: [
            ...state.pendingSyncs,
            { ...attendance, id: crypto.randomUUID(), synced: false },
          ],
        })),
      markSynced: (id) =>
        set((state) => ({
          pendingSyncs: state.pendingSyncs.map((s) =>
            s.id === id ? { ...s, synced: true } : s
          ),
        })),
      removePendingSync: (id) =>
        set((state) => ({
          pendingSyncs: state.pendingSyncs.filter((s) => s.id !== id),
        })),
      addSignedMeeting: (meetingId) =>
        set((state) => {
          if (state.signedMeetings.includes(meetingId)) return state;
          return { signedMeetings: [...state.signedMeetings, meetingId] };
        }),
      isMeetingSigned: (meetingId) => get().signedMeetings.includes(meetingId),
      clearPendingSyncs: () => set({ pendingSyncs: [] }),
    }),
    {
      name: "medcall-attendance",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// UI State
interface UIState {
  isSidebarOpen: boolean;
  currentPage: "home" | "meeting" | "history" | "settings";
  authModal: "login" | "register" | null;
  toggleSidebar: () => void;
  setCurrentPage: (page: UIState["currentPage"]) => void;
  setAuthModal: (modal: UIState["authModal"]) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: false,
  currentPage: "home",
  authModal: null,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setCurrentPage: (page) => set({ currentPage: page }),
  setAuthModal: (modal) => set({ authModal: modal }),
}));
