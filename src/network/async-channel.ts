export class AsyncChannel<T> {
	private queue: T[] = [];
	private waiters: Array<{
		resolve: (result: IteratorResult<T>) => void;
		reject: (error: Error) => void;
	}> = [];
	private _closed = false;
	private _error: Error | null = null;

	get closed(): boolean {
		return this._closed;
	}

	send(value: T): void {
		if (this._closed) return;

		if (this.waiters.length > 0) {
			const waiter = this.waiters.shift()!;
			waiter.resolve({ value, done: false });
		} else {
			this.queue.push(value);
		}
	}

	error(err: Error): void {
		this._error = err;
		this._closed = true;
		for (const waiter of this.waiters) {
			waiter.reject(err);
		}
		this.waiters = [];
	}

	close(): void {
		this._closed = true;
		for (const waiter of this.waiters) {
			waiter.resolve({ value: undefined as T, done: true });
		}
		this.waiters = [];
	}

	[Symbol.asyncIterator](): AsyncIterator<T> {
		return {
			next: async (): Promise<IteratorResult<T>> => {
				if (this.queue.length > 0) {
					return { value: this.queue.shift()!, done: false };
				}

				if (this._closed) {
					if (this._error) throw this._error;
					return { value: undefined as T, done: true };
				}

				return new Promise((resolve, reject) => {
					this.waiters.push({ resolve, reject });
				});
			},
		};
	}
}
