class PersonaService {
  #socket = null;
  #subs = [];

  subscribe(fn) {
    this.#subs.push(fn);
    if (!this.#socket) this.#connectWS();
  }

  /*───────────────── private ─────────────────*/
  #connectWS() {
    this.#socket = new WebSocket(
      `${location.origin.replace('http', 'ws')}/ws/personas`
    );
    this.#socket.onmessage = evt => {
      const msg = JSON.parse(evt.data);
      // new: intent relay
      if (msg.type === 'intent-broadcast') this.#subs.forEach(fn => fn(msg));
      else                                 this.#subs.forEach(fn => fn(msg));
    };
    this.#socket.onclose = () => setTimeout(() => this.#connectWS(), 1_000);
  }
  /* NEW ↓ — subscribe to global intent stream */
  connectIntentStream(cb) {
    const sock = new WebSocket(
      `${location.origin.replace('http', 'ws')}/ws/intents`
    );
    sock.onmessage = e => cb(JSON.parse(e.data));
    return () => sock.close();
  }
}

export const personaService = new PersonaService();
