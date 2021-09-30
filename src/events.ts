import { debug } from "./debug";

type EventType = "ready" | "check";

// The main purpose of the event bus is to issue commands to the React
// application.
export class EventBus {
  subscribers: Record<string, Function>;

  constructor() {
    this.subscribers = {};
  }

  // TODO: Make type-safe rather than relying on Function.
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
