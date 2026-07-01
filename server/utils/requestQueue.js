export class RequestQueue {
    constructor(concurrency = 1) {
        this.queue = [];
        this.processing = 0;
        this.concurrency = concurrency;
    }

    enqueue(task, retries = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject, retries, delay });
            this.processNext();
        });
    }

    async processNext() {
        if (this.processing >= this.concurrency || this.queue.length === 0) return;
        this.processing++;

        const item = this.queue.shift();
        if (!item) {
            this.processing--;
            return;
        }

        const { task, resolve, reject, retries, delay } = item;

        const execute = async (attempt = 1) => {
            try {
                const result = await task();
                resolve(result);
            } catch (error) {
                if (attempt < retries) {
                    console.warn(`Task failed, retrying attempt ${attempt + 1}/${retries} in ${delay}ms... Error: ${error.message}`);
                    setTimeout(() => execute(attempt + 1), delay);
                } else {
                    reject(error);
                }
            } finally {
                this.processing--;
                this.processNext();
            }
        };

        execute();
    }
}

export const orderQueue = new RequestQueue(1); // Process orders sequentially one-by-one to prevent concurrency race conditions
