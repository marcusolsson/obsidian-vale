export const timed = <T>(label: string, cb: () => Promise<T>): Promise<T> => {
  if (DEBUG) {
    console.log(label + " started");
    console.time(label + " finished in");
    const res = cb().finally(() => {
      console.timeEnd(label + " finished in");
    });
    return res;
  }
  return cb();
};

export const debug = (msg: string) => {
  if (DEBUG) {
    console.log(msg);
  }
};
