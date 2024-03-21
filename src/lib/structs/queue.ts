/**
 * A queue is a data structure that follows the FIFO (First In First Out) principle.
 */
export default class Queue<T> {
  private items: T[];

  constructor(items: T[] = []) {
    this.items = items;
  }

  /**
   * Add an item to the queue
   * @param item 
   */
  enqueue(item: T): void {
    this.items.push(item);
  }

  /**
   * Remove the first item from the queue
   * @returns {T} The first item in the queue
   */
  dequeue(): T | undefined {
    return this.items.shift();
  }

  /**
   * Get the first item in the queue
   * @returns {T} The first item in the queue
   */
  peek(): T | undefined {
    return this.items[0];
  }

  /**
   * Determine whether the queue is empty
   * @returns {boolean} Whether the queue is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Get the number of items in the queue
   * @returns {number} The number of items in the queue
   */
  size(): number {
    return this.items.length;
  }
}