// A banner when the read lands. Best effort on every platform, never a reason for a run to fail.
// macOS: a plain notification (clicking it does nothing). Linux: notify-send if present.
// Windows: nothing yet; the page and STATUS.md carry the read.

import { execFile } from "node:child_process";

const q = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').slice(0, 240);

export function notify(title, message) {
  return new Promise((resolve) => {
    const done = () => resolve();
    if (process.platform === "darwin") {
      execFile("osascript", ["-e", `display notification "${q(message)}" with title "${q(title)}"`], done);
    } else if (process.platform === "linux") {
      execFile("notify-send", [title, message], done);
    } else {
      done();
    }
  });
}
