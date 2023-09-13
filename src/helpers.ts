export const binarySearch = <T, K>(
  elem: K,
  arr: T[],
  compareFn: (a: T, b: T) => number,
): [number, boolean] => {
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

  private readonly appendStrategy: (prevVals: T[], newVal: T) => T[];
  private counter = 0;

  constructor(
    private readonly capacity: number,
    appendStrategy?: (prevVals: T[], newVal: T) => T[],
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
    const node = new Node<T>(
      key,
      Array.isArray(prevVals) ? this.appendStrategy(prevVals, value) : value,
    );
    this.cache[key] = node;

    this.insertNode(this.cache[key]);

    if (Object.keys(this.cache).length > this.capacity) {
      const leastUsed = this.left.next;
      this.removeNode(leastUsed);
      delete this.cache[leastUsed.key];
    }
  }

  private appendStrategyDefault(prevVals: T[], newVal: T): T[] {
    if (!prevVals.includes(newVal)) prevVals.push(newVal);
    return prevVals;
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
