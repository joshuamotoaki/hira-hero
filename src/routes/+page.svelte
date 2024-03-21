<script lang="ts">
  import { onMount } from "svelte";
  import { AppBar, AppShell } from "@skeletonlabs/skeleton";
  import keyboardJp from "$lib/keyboardJp.webp"

  class Queue<T> {
    private items: T[];

    constructor(items = []) {
        this.items = items;
    }

    enqueue(item: T): void {
        this.items.push(item);
    }

    dequeue(): T | undefined {
        return this.items.shift();
    }

    peek(): T | undefined {
        return this.items[0];
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }
  }

  /**
   * Characters per minute calculator
   */
  class CPM {
    private MAX_LENGTH = 25;
    private MIN_LENGTH = 15;
    private SPEED_THRESHOLD = 75;
    
    private timeSeries: number[] = [];

    constructor() {
      this.timeSeries = [];
    }

    reset(): void {
      this.timeSeries = [];
    }

    getCPM(): number {
      const timeDifference = this.timeSeries[this.timeSeries.length - 1] - this.timeSeries[0];
      return (this.timeSeries.length / timeDifference) * 60000;
    }

    shouldProgress(): boolean {
      if (this.timeSeries.length < this.MIN_LENGTH) return false;
      return this.getCPM() > this.SPEED_THRESHOLD;
    } 

    /**
     * Penalize the user by adding a time 1 second before the first time in the time series
     */
    penalize(): void {
      if (this.timeSeries.length > 0) 
        this.timeSeries[0] = this.timeSeries[0] - 1000;      
    }

    /**
     * Add a time to the time series
     * @returns {boolean} Whether the user should progress to the next character
     */
    addTime(): boolean {
      let currentTime = Date.now();
      if (currentTime - this.timeSeries[this.timeSeries.length - 1] > 5000) {
        currentTime = this.timeSeries[this.timeSeries.length - 1] + 5000;
      }
      this.timeSeries.push(currentTime);
      if (this.timeSeries.length > this.MAX_LENGTH) {
        this.timeSeries.shift();
      }
      return this.shouldProgress();
    }
  }

  let ready = false;

  const HIRAGANA = [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も",
    "や", "ゆ", "よ",
    "ら", "り", "る", "れ", "ろ",
    "わ", "を", "ん"
  ];

  let unlearned: Queue<string>;
  let learned: string[] = [];
  let currentDisplay: string[] = new Array(7);

  let cpm = new CPM();

  const calculateOpacity = (index: number) => {
    if (index === 3) return 1;

    const distance = Math.abs(index - 3);
    return distance >= 5 ? 0 : 0.5 - distance * 0.14;
  }

  const handleInput = (event: KeyboardEvent) => {
    if (event.key === currentDisplay[3]) {
      if (cpm.addTime()) {
        learned.push(unlearned.dequeue());
        localStorage.setItem("learned", JSON.stringify(learned));
        numInCycle++;
        cpm.reset();
      }
      currentDisplay.shift();
      currentDisplay[currentDisplay.length] = learned[Math.floor(Math.random() * learned.length)];
    }
    currentCPM = cpm.getCPM() === Infinity || isNaN(cpm.getCPM()) ? 0 : cpm.getCPM();
  }

  let currentCPM = 0;
  let numInCycle = 0;

  onMount(() => {
    localStorage.getItem("learned") ? learned = JSON.parse(localStorage.getItem("learned")) : learned = [HIRAGANA[0], HIRAGANA[1]];
    localStorage.setItem("learned", JSON.stringify(learned));

    const unlearnedArray = HIRAGANA.filter((character) => !learned.includes(character));
    unlearned = new Queue<string>(unlearnedArray);

    numInCycle = learned.length;

    for (let i = 0; i < currentDisplay.length; i++) {
      currentDisplay[i] = learned[Math.floor(Math.random() * learned.length)];
    }

    document.body.addEventListener("keydown", handleInput);
  
    ready = true;
  });
</script>

<svelte:head>
  <title>HiraHero</title>
  <meta name="description" content="Learn Japanese characters" />
  <meta name="keywords" content="Japanese, Hiragana, Katakana, Learn" />
  <meta name="author" content="Joshua Lau" />
</svelte:head>

<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<a href="/">
					<strong class="text-xl">HiraHero</strong>
				</a>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<button
          class="btn btn-sm variant-ghost-surface"
          on:click={() => {
            if (confirm("Are you sure you want to reset your progress?")) {
              localStorage.clear();
              location.reload();
            }
          }}
        >
          Reset
        </button>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
  <div class="max-w-7xl mx-auto px-8">
    {#if ready}
    <div>
      <h1 class="text-4xl text-center mt-8">Learn Japanese Characters</h1>
    </div>
    <div class="flex justify-center w-full mt-6">
      {#each currentDisplay as character, index}
        <div class="character {index === 3 && 'underline'}" 
        style="opacity: {calculateOpacity(index)}">
          {character}
        </div>
      {/each}
    </div>
    {/if}

    <div>
      <p class="text-center mt-8 space-x-8">
        <span>
          CPM: {currentCPM.toFixed(2)} 
        </span>
        <span>
          Characters: {numInCycle} 
        </span>
      </p>
    </div>
  
    <img src={keyboardJp} alt="Japanese Keyboard" class="w-2/3 mx-auto mt-10" />

    <div class="mt-14 space-y-2 w-2/3 mx-auto">
      <h2 class="text-center text-xl">
        Gameplay
      </h2>
      <p class="text-center">
        Type the character in the middle of the screen to progress to the next character.
        Once you reach 75 characters-per-minute (CPM) with at least 15 typed characters 
        (with a max window size of 25 previous types and max difference of 5 seconds between each character typed), 
        you will progress to the next character, and the CPM will reset.
      </p>
      <p class="text-center">
        Progress is saved locally, so you can continue where you left off.
        You can reset your progress by clicking the "Reset" button in the top right corner.
      </p>
    </div>
  </div>
</AppShell>


<style lang="postcss">
  .character {
    transition: opacity 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
    font-size: 42px;
    padding: 0 10px;
  }
</style>