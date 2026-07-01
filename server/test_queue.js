import { RequestQueue } from "./utils/requestQueue.js";

const queue = new RequestQueue(1);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("Starting RequestQueue sequential verification test...\n");

const results = [];

// Enqueue Task 1 with 300ms delay
const promise1 = queue.enqueue(async () => {
    console.log("[Queue] Task 1 started (needs 300ms)");
    await delay(300);
    console.log("[Queue] Task 1 completed");
    results.push("Task 1");
    return "Result 1";
});

// Enqueue Task 2 with 150ms delay
const promise2 = queue.enqueue(async () => {
    console.log("[Queue] Task 2 started (needs 150ms)");
    await delay(150);
    console.log("[Queue] Task 2 completed");
    results.push("Task 2");
    return "Result 2";
});

// Enqueue Task 3 with 50ms delay
const promise3 = queue.enqueue(async () => {
    console.log("[Queue] Task 3 started (needs 50ms)");
    await delay(50);
    console.log("[Queue] Task 3 completed");
    results.push("Task 3");
    return "Result 3";
});

// Await all and verify order
Promise.all([promise1, promise2, promise3]).then((res) => {
    console.log("\nAll tasks finished!");
    console.log("Execution Order:", results.join(" -> "));
    console.log("Returned Results:", res);

    if (results[0] === "Task 1" && results[1] === "Task 2" && results[2] === "Task 3") {
        console.log("\n✅ SUCCESS: Queue executed tasks sequentially in FIFO order (Task 1 -> Task 2 -> Task 3) despite shorter execution times for later tasks.");
    } else {
        console.log("\n❌ FAILURE: Tasks did not execute sequentially.");
    }
    process.exit(0);
});
