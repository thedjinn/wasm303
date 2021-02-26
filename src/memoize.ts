class Cache<V> {
    cache: {
        [key: string]: V;
    };

    constructor() {
        this.cache = Object.create(null);
    }

    has(key: string): boolean {
        return key in this.cache;
    }

    get(key: string): V | undefined {
        return this.cache[key];
    }

    set(key: string, value: V) {
        this.cache[key] = value;
    }
}

function isPrimitive(value: unknown): value is null | number | boolean {
    return value == null || typeof value === "number" || typeof value === "boolean";
}

function monadic<P, R, F extends (arg: P) => R>(fn: F, cache: Cache<R>, arg: P): R {
    const cacheKey = isPrimitive(arg) ? (arg as unknown as string) : JSON.stringify(arg);

    let computedValue = cache.get(cacheKey);
    if (typeof computedValue === "undefined") {
        computedValue = fn.call(this, arg);
        cache.set(cacheKey, computedValue);
    }

    return computedValue;
}

function variadic<R, F extends (...arg: unknown[]) => R>(fn: F, cache: Cache<R>, ...args: Parameters<F>): R {
    const cacheKey = JSON.stringify(args);

    let computedValue = cache.get(cacheKey);
    if (typeof computedValue === "undefined") {
        computedValue = fn.apply(this, args);
        cache.set(cacheKey, computedValue);
    }

    return computedValue;
}

export default function memoize<R, T extends (...args: unknown[]) => R>(fn: T): T {
    return (fn.length === 1 ? monadic : variadic).bind(this, fn, new Cache());
}

