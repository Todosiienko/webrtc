export function createSignaling({ url, roomId, onSignal }) {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "join",
      roomId,
      peerType:'electron',
      role:'sender'
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "signal") {
      onSignal(data.signal);
    }
    if(data.type === "peer-joined"){
      onSignal({peerJoined:true})
    }
  };

  function sendSignal(signal) {
    ws.send(JSON.stringify({
      type: "signal",
      signal
    }));
  }

  return { sendSignal, ws };
}
