// WebRTC Configuration for MedCall
// Supports STUN/TURN servers for NAT traversal

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy: RTCIceTransportPolicy;
  bundlePolicy: RTCBundlePolicy;
  rtcpMuxPolicy: RTCRtcpMuxPolicy;
}

// STUN servers for NAT traversal (free public servers)
const STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

// TURN servers for restrictive networks (would need to be configured with actual credentials)
const TURN_SERVERS: RTCIceServer[] = [
  // Example TURN server - replace with actual credentials in production
  // {
  //   urls: "turn:your-turn-server.com:3478",
  //   username: "username",
  //   credential: "password",
  // },
];

// Default WebRTC configuration
export const defaultWebRTCConfig: WebRTCConfig = {
  iceServers: [...STUN_SERVERS, ...TURN_SERVERS],
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

// Video constraints for adaptive quality
export const videoConstraints = {
  high: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: "user",
  },
  medium: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24, max: 24 },
    facingMode: "user",
  },
  low: {
    width: { ideal: 320 },
    height: { ideal: 240 },
    frameRate: { ideal: 15, max: 15 },
    facingMode: "user",
  },
  audioOnly: false,
};

// Audio constraints (Opus codec preferred)
export const audioConstraints: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 1,
};

// SDP manipulation for Opus codec preference
export function preferOpusCodec(sdp: string): string {
  const sdpLines = sdp.split("\r\n");
  let mLineIndex = -1;

  // Find m=audio line
  for (let i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].includes("m=audio")) {
      mLineIndex = i;
      break;
    }
  }

  if (mLineIndex === -1) return sdp;

  // Find Opus codec
  let opusPayload = "";
  for (const line of sdpLines) {
    if (line.includes("a=rtpmap") && line.includes("opus/48000")) {
      opusPayload = line.split(" ")[0].split(":")[1];
      break;
    }
  }

  if (!opusPayload) return sdp;

  // Move Opus to first position in m=audio line
  const mLineElements = sdpLines[mLineIndex].split(" ");
  const newMLine: string[] = [mLineElements[0], mLineElements[1], mLineElements[2]];

  // Add Opus first
  newMLine.push(opusPayload);

  // Add other codecs
  for (let i = 3; i < mLineElements.length; i++) {
    if (mLineElements[i] !== opusPayload) {
      newMLine.push(mLineElements[i]);
    }
  }

  sdpLines[mLineIndex] = newMLine.join(" ");
  return sdpLines.join("\r\n");
}

// Network quality estimation
export async function estimateNetworkQuality(): Promise<{
  bandwidth: number;
  rtt: number;
  quality: "excellent" | "good" | "poor" | "critical";
}> {
  // Use RTCPeerConnection to gather connection stats
  const pc = new RTCPeerConnection({
    iceServers: STUN_SERVERS,
  });

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      pc.close();
      resolve({ bandwidth: 0, rtt: 999, quality: "critical" });
    }, 5000);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Parse candidate to estimate connection type
        const candidate = event.candidate.candidate;
        const isLocal =
          candidate.includes("typ host") ||
          candidate.includes("192.168.") ||
          candidate.includes("10.") ||
          candidate.includes("172.");

        clearTimeout(timeout);
        pc.close();

        // Estimate based on local vs relay connection
        if (isLocal) {
          resolve({ bandwidth: 5000, rtt: 5, quality: "excellent" });
        } else {
          // Simulate network test (in real app, would use actual stats)
          resolve({ bandwidth: 1500, rtt: 50, quality: "good" });
        }
      }
    };

    // Create dummy offer to trigger ICE gathering
    pc.createDataChannel("test");
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => {
        clearTimeout(timeout);
        pc.close();
        resolve({ bandwidth: 0, rtt: 999, quality: "critical" });
      });
  });
}

// Adaptive bitrate controller
export class AdaptiveBitrateController {
  private peerConnection: RTCPeerConnection | null = null;
  private videoSender: RTCRtpSender | null = null;
  private currentQuality: "high" | "medium" | "low" | "audioOnly" = "high";
  private intervalId: NodeJS.Timeout | null = null;

  constructor(pc: RTCPeerConnection) {
    this.peerConnection = pc;
    this.videoSender = pc
      .getSenders()
      .find((s) => s.track?.kind === "video") || null;
  }

  startMonitoring(): void {
    this.intervalId = setInterval(() => this.checkQuality(), 3000);
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkQuality(): Promise<void> {
    if (!this.peerConnection || !this.videoSender) return;

    try {
      const stats = await this.peerConnection.getStats();
      let packetsLost = 0;
      let packetsReceived = 0;
      let bytesReceived = 0;
      let jitter = 0;

      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          packetsLost = report.packetsLost || 0;
          packetsReceived = report.packetsReceived || 0;
          jitter = report.jitter || 0;
        }
        if (report.type === "inbound-rtp" && report.kind === "video") {
          bytesReceived = report.bytesReceived || 0;
        }
      });

      const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;

      // Adjust quality based on network conditions
      if (lossRate > 0.1 || jitter > 0.1) {
        this.downgrade();
      } else if (lossRate < 0.02 && jitter < 0.03 && this.currentQuality !== "high") {
        this.upgrade();
      }
    } catch (error) {
      console.error("Error checking quality:", error);
    }
  }

  private downgrade(): void {
    const qualityOrder: Array<"high" | "medium" | "low" | "audioOnly"> = [
      "high",
      "medium",
      "low",
      "audioOnly",
    ];
    const currentIndex = qualityOrder.indexOf(this.currentQuality);
    if (currentIndex < qualityOrder.length - 1) {
      this.currentQuality = qualityOrder[currentIndex + 1];
      this.applyQuality();
    }
  }

  private upgrade(): void {
    const qualityOrder: Array<"high" | "medium" | "low" | "audioOnly"> = [
      "high",
      "medium",
      "low",
      "audioOnly",
    ];
    const currentIndex = qualityOrder.indexOf(this.currentQuality);
    if (currentIndex > 0) {
      this.currentQuality = qualityOrder[currentIndex - 1];
      this.applyQuality();
    }
  }

  private applyQuality(): void {
    if (!this.videoSender) return;

    const parameters = this.videoSender.getParameters();
    if (!parameters.encodings || parameters.encodings.length === 0) {
      parameters.encodings = [{}];
    }

    switch (this.currentQuality) {
      case "high":
        parameters.encodings[0].maxBitrate = 2500000;
        parameters.encodings[0].scaleResolutionDownBy = 1;
        break;
      case "medium":
        parameters.encodings[0].maxBitrate = 1000000;
        parameters.encodings[0].scaleResolutionDownBy = 2;
        break;
      case "low":
        parameters.encodings[0].maxBitrate = 300000;
        parameters.encodings[0].scaleResolutionDownBy = 4;
        break;
      case "audioOnly":
        // Disable video track
        if (this.videoSender.track) {
          this.videoSender.track.enabled = false;
        }
        return;
    }

    // Re-enable video if coming from audio-only
    if (this.videoSender.track) {
      this.videoSender.track.enabled = true;
    }

    this.videoSender.setParameters(parameters);
  }

  getQuality(): string {
    return this.currentQuality;
  }
}

// P2P Connection Manager for local network
export class P2PConnectionManager {
  private connections: Map<string, RTCPeerConnection> = new Map();
  private localId: string;

  constructor(localId: string) {
    this.localId = localId;
  }

  async createConnection(peerId: string): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection(defaultWebRTCConfig);
    this.connections.set(peerId, pc);
    return pc;
  }

  getConnection(peerId: string): RTCPeerConnection | undefined {
    return this.connections.get(peerId);
  }

  closeConnection(peerId: string): void {
    const pc = this.connections.get(peerId);
    if (pc) {
      pc.close();
      this.connections.delete(peerId);
    }
  }

  closeAll(): void {
    for (const [peerId] of this.connections) {
      this.closeConnection(peerId);
    }
  }

  getActiveConnections(): string[] {
    return Array.from(this.connections.keys());
  }
}
