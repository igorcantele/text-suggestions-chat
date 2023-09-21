export const binarySearch = <T, K>(
  elem: K,
  arr: T[],
  compareFn: (a: T, b: T) => number,
): [number, boolean] => {
  let left = 0;
  let right = arr.length;

  while (left <= right) {
    const mid = Math.floor((right + left) / 2);
    if (compareFn(arr[left], arr[mid]) > 0) {
      right = mid - 1;
    } else if (compareFn(arr[mid], arr[right]) > 0) {
      left = mid + 1;
    } else {
      return [mid, true];
    }
  }
  return [-1, false];
};

class Node<T> {
  public prev!: Node<T>;
  public next!: Node<T>;

  constructor(public key: string, public val: T | T[]) {}
}

export class LRUCache<T> {
  private readonly left: Node<T> = new Node('', {} as T);
  private readonly right: Node<T> = new Node('', {} as T);
  private readonly cache: Record<string, Node<T>> = {};

  private readonly appendStrategy: (prevVals: T[], newVal: T) => [T[], number];
  private counter = 0;

  constructor(
    private readonly capacity: number,
    appendStrategy?: (prevVals: T[], newVal: T) => [T[], number],
  ) {
    this.left.next = this.right;
    this.right.prev = this.left;

    this.appendStrategy = appendStrategy ?? this.appendStrategyDefault;
  }

  get(key: string) {
    if (key in this.cache) {
      this.removeNode(this.cache[key]);
      this.insertNode(this.cache[key]);
    }
    return this.cache[key];
  }

  put(key: string, value: T) {
    const prevVals = this.cache[key].val;
    const [newValue, counterIncrement] = Array.isArray(prevVals)
      ? this.appendStrategy(prevVals, value)
      : [value, 1];

    const node = new Node<T>(key, newValue);
    this.cache[key] = node;

    this.counter = this.counter + counterIncrement;

    this.insertNode(this.cache[key]);

    if (this.counter > this.capacity) {
      const leastUsed = this.left.next;
      this.removeNode(leastUsed);
      delete this.cache[leastUsed.key];
    }
  }

  private appendStrategyDefault(prevVals: T[], newVal: T): [T[], number] {
    let increment = 0;
    if (!prevVals.includes(newVal)) {
      prevVals.push(newVal);
      increment++;
    }
    return [prevVals, increment];
  }

  private removeNode(node: Node<T>) {
    const prev = node.prev;
    const next = node.next;
    prev.next = next;
    next.prev = prev;
  }

  private insertNode(node: Node<T>) {
    const prev = this.right.prev;

    node.next = this.right;
    node.prev = prev;

    prev.next = node;
    this.right.prev = node;
  }
}
