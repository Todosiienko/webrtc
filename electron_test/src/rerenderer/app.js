import { createSignaling } from "./signaling.js";
import { createPeerConnection } from "./webrtc.js";

window.addEventListener('load', async () => {

  console.log("App loaded");

  // -------------------
  // 1️⃣ Signaling
  // -------------------
  const pendingCandidates = [];

  let receiverReady = false; // чекатимемо, поки receiver приєднається
  let offerSent = false;

  const signaling = createSignaling({
    url: "ws://localhost:3000",
    roomId: "room-123",
    onSignal: async (signal) => {
      console.log("⬇️ Signal received:", signal);

      // --- обробка peer-joined ---
      if (signal.peerJoined) {
        console.log("👋 Receiver joined, ready to send offer");
        receiverReady = true;

        if (!offerSent) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          signaling.sendSignal({ sdp: pc.localDescription });
          console.log("⬆️ Offer sent");
          offerSent = true;
        }
        return;
      }

      // --- обробка SDP ---
      if (signal.sdp) {
        await pc.setRemoteDescription(signal.sdp);
        console.log("✅ Remote SDP set:", signal.sdp.type);

        // Додаємо ICE кандидати, що прийшли раніше
        pendingCandidates.forEach(c => pc.addIceCandidate(c));
        pendingCandidates.length = 0;

        if (signal.sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signaling.sendSignal({ sdp: pc.localDescription });
          console.log("⬆️ Answer sent");
        }
      }

      // --- обробка ICE candidates ---
      if (signal.candidate) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(signal.candidate);
          console.log("➕ ICE candidate added");
        } else {
          pendingCandidates.push(signal.candidate);
          console.log("🕒 ICE candidate buffered");
        }
      }
    }
  });

  // -------------------
  // 2️⃣ PeerConnection
  // -------------------
  const pc = createPeerConnection((candidate) => {
    console.log("⬆️ Sending ICE candidate");
    signaling.sendSignal({ candidate });
  });

  pc.oniceconnectionstatechange = () => {
    console.log("🔗 ICE state:", pc.iceConnectionState);
  };
  pc.onconnectionstatechange = () => {
    console.log("🔗 Connection state:", pc.connectionState);
  };

  // -------------------
  // 3️⃣ Screen capture (Web API)
  // -------------------
  async function getScreenStream() {
    console.log("🖥️ Requesting screen capture...");
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: false
    });
    return stream;
  }
  async function getCameraStream(){
    return await navigator.mediaDevices.getUserMedia({
      video:{width:1280,height:720, frameRate:30},
      audio:false
    })
  }

  const stream = await getCameraStream();
  console.log("🎥 Local stream tracks:", stream.getTracks());

  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  // Локальне відео (дебаг)
  const localVideo = document.querySelector("#localVideo");
  if (localVideo) {
    localVideo.srcObject = stream;
    localVideo.muted = true;
    localVideo.play();
  }

  // -------------------
  // 4️⃣ Не надсилаємо offer відразу — чекаємо peer-joined
  // -------------------
  signaling.ws.onopen = () => {
    console.log("🔌 Signaling connected");
    // тепер offer відправиться ТІЛЬКИ після peerJoined
  };

});
