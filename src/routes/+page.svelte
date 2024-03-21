<script lang="ts">
  import { onMount } from "svelte";
  import { AppBar, AppShell } from "@skeletonlabs/skeleton";

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
    private MAX_LENGTH = 30;
    private MIN_LENGTH = 10;
    private SPEED_THRESHOLD = 100;
    
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
      this.timeSeries.push(Date.now());
      if (this.timeSeries.length > this.MAX_LENGTH) {
        this.timeSeries.shift();
      }
      return this.shouldProgress();
    }
  }

  const CPM_THRESHOLD = 100;
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
  
        cpm.reset();
      }
      for (let i = 0; i < currentDisplay.length - 1; i++) {
        currentDisplay[i] = currentDisplay[i + 1];
      }
      currentDisplay[currentDisplay.length - 1] = learned[Math.floor(Math.random() * learned.length)];
    } else {

    }
    console.log(cpm.getCPM());
  }

  onMount(() => {
    localStorage.getItem("learned") ? learned = JSON.parse(localStorage.getItem("learned")) : learned = [HIRAGANA[0]];
    localStorage.setItem("learned", JSON.stringify(learned));

    const unlearnedArray = HIRAGANA.filter((character) => !learned.includes(character));
    unlearned = new Queue<string>(unlearnedArray);

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
  <div>
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
      <p class="text-center mt-8">Type the underlined character in the middle</p>
    </div>
  
    <img src="/src/lib/keyboardJp.png" alt="Japanese Keyboard" class="w-1/2 mx-auto mt-14" />

  </div>
</AppShell>


<style lang="postcss">
  .character {
    transition: opacity 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
    font-size: 42px;
    padding: 0 10px;
  }
</style>