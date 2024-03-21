/**
 * Characters per minute calculator
 */
export default class CPM {
  private timeSeries: number[] = []; // Time series of the user's typing
  
  private maxWindow = 25;            // Maximum length of the time series
  private minWindow = 15;            // Minimum length of the times series for progression
  private cpmThreshold = 75;         // Characters per minute threshold for progression

  private readonly MAX_TIME = 5000;     // Maximum time between key presses (not including penalty time)
  private readonly MAX_PENALTY = 5000;  // Maximum penalty amount
  private penaltyAmount = 0;            // Amount of penalty to apply
  
  /**
   * Reset the time series and parameters
   */
  reset(): void {
    this.timeSeries = [];
    this.maxWindow = 25;
    this.minWindow = 15;
    this.cpmThreshold = 75;
  }

  /**
   * Get the maximum window size
   * @returns {number} The maximum window size
   */
  getMaxWindow(): number {
    return this.maxWindow;
  }

  /**
   * Get the minimum window size
   * @returns {number} The minimum window size
   */
  getMinWindow(): number {
    return this.minWindow;
  }

  /**
   * Get the number of characters per minute threshold
   * @returns {number} The number of characters per minute threshold
   */
  getCpmThreshold(): number {
    return this.cpmThreshold;
  }

  /**
   * Set the maximum window size
   * @param maxWindow
   */
  setMaxWindow(maxWindow: number): void {
    this.maxWindow = maxWindow;
  }

  /**
   * Set the minimum window size
   * @param minWindow
   */
  setMinWindow(minWindow: number): void {
    this.minWindow = minWindow;
  }

  /**
   * Set the number of characters per minute
   * @param cpmThreshold 
   */
  setCpmThreshold(cpmThreshold: number): void {
    this.cpmThreshold = cpmThreshold;
  }

  /**
   * Get the number of characters per minute
   * @returns {number} The number of characters per minute
   */
  getCPM(): number {
    const timeDifference = this.timeSeries[this.timeSeries.length - 1] - this.timeSeries[0];
    return (this.timeSeries.length / timeDifference) * 60000;
  }

  /**
   * Determine whether the user should progress to the next character
   * @returns {boolean} Whether the user should progress to the next character
   */
  shouldProgress(): boolean {
    if (this.timeSeries.length < this.minWindow) return false;
    return this.getCPM() > this.cpmThreshold;
  } 

  /**
   * Penalize the user for a mistake
   * @param {number} penalty - The penalty to apply in milliseconds
   */
  penalize(penalty: number = 1000): void {
    if (penalty < 0) {
      console.error('Penalty cannot be negative');
      return;
    }
    if (penalty >= this.MAX_PENALTY) return;
    this.penaltyAmount += penalty;   
  }

  /**
   * Add a time to the time series
   * @returns {boolean} Whether the user should progress to the next character
   */
  addTime(): boolean {
    let currentTime = Date.now();
    if (currentTime - this.timeSeries[this.timeSeries.length - 1] >= this.MAX_TIME) {
      currentTime = this.timeSeries[this.timeSeries.length - 1] + this.MAX_TIME;
    }

    currentTime += this.penaltyAmount;
    this.penaltyAmount = 0;

    this.timeSeries.push(currentTime);
    if (this.timeSeries.length > this.maxWindow) {
      this.timeSeries.shift();
    }
    return this.shouldProgress();
  }
}
