import { debug } from "./utils";

type EventType = "ready" | "check";

export class EventBus {
  subscribers: Record<string, Function>;

  constructor() {
    this.subscribers = {};
  }

  on(topic: EventType, cb: Function): () => void {
    debug(`Registering subscriber for topic "${topic}"`);
    this.subscribers[topic] = cb;

    return () => {
      debug(`Unregistering subscriber for topic "${topic}"`);
      delete this.subscribers[topic];
    };
  }

  dispatch<T>(topic: string, msg: T): void {
    debug(`Dispatched event on topic "${topic}"`);

    const cb = this.subscribers[topic];
    if (cb) {
      cb(msg);
    } else {
      console.warn("Dispatched event has no subscriber:", topic);
    }
  }
}
