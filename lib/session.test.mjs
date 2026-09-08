// Run: node --experimental-strip-types lib/session.test.mjs  (or npx tsx)
import assert from "node:assert/strict";
import { apply } from "./session.ts";
const base = () => ({ code: "ABCD", mode: "timer", task: "", status: "idle", startedAt: null, endsAt: null, breaksLeft: 2, breakUntil: null, resumeEndsAt: null, submitted: false, log: [], updatedAt: 0 });
let s = apply(base(), { type: "start", mode: "timer", minutes: 25 });
assert.equal(s.status, "locked");
s = apply(s, { type: "break" });
assert.equal(s.status, "break"); assert.equal(s.breaksLeft, 1);
s = apply(s, { type: "endBreak" });
assert.equal(s.status, "locked");
s = apply(s, { type: "submit" });
assert.equal(s.status, "locked", "timer mode: submit does not unlock");
s = apply(base(), { type: "start", mode: "assignment" });
assert.equal(s.endsAt, null);
s = apply(s, { type: "submit" });
assert.equal(s.status, "unlocked");
console.log("ok");
