export function createPeerConnection(onIceCandidate) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      onIceCandidate(e.candidate);
    }
  };

  return pc;
}
