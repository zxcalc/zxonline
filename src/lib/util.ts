export function moveForward<T>(m: Map<number, T>, elems: Set<number>): Map<number, T> {
    const arr = Array.from(m.entries());
    for (let i = arr.length - 1; i >= 1; i--) {
        if (!elems.has(arr[i][0]) && elems.has(arr[i - 1][0])) {
            [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
        }
    }

    return new Map(arr);
}

export function moveBackward<T>(m: Map<number, T>, elems: Set<number>): Map<number, T> {
    const arr = Array.from(m.entries());
    for (let i = 0; i <= arr.length - 2; i++) {
        if (!elems.has(arr[i][0]) && elems.has(arr[i + 1][0])) {
            [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        }
    }

    return new Map(arr);
}

export function moveToFront<T>(m: Map<number, T>, elems: Set<number>): Map<number, T> {
    const arr = Array.from(m.entries());
    const arr1 = arr.filter(([id]) => !elems.has(id));
    const arr2 = arr.filter(([id]) => elems.has(id));
    return new Map([...arr1, ...arr2]);
}

export function moveToBack<T>(m: Map<number, T>, elems: Set<number>): Map<number, T> {
    const arr = Array.from(m.entries());
    const arr1 = arr.filter(([id]) => elems.has(id));
    const arr2 = arr.filter(([id]) => !elems.has(id));
    return new Map([...arr1, ...arr2]);
}