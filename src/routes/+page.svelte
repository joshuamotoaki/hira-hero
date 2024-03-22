<script lang="ts">
  import { onMount } from "svelte";
  import { AppBar, AppShell, getToastStore } from "@skeletonlabs/skeleton";
  import keyboardJp from "$lib/keyboardJp.webp"
  import Queue from "$lib/structs/queue";
  import CPM from "./cpm";

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
      if (cpm.addTime() && !unlearned.isEmpty()) {
        learned.push(unlearned.dequeue() as string);
        localStorage.setItem("learned", JSON.stringify(learned));
        numInCycle++;
        cpm.reset();
      }
      currentDisplay.shift();

      // Add a new character to the end of the array, 
      // ensuring it's not the same as the previous character
      let nextCharacter = learned[Math.floor(Math.random() * learned.length)];
      while (nextCharacter === currentDisplay[currentDisplay.length - 1]) {
        nextCharacter = learned[Math.floor(Math.random() * learned.length)];
      }
      currentDisplay[currentDisplay.length] = nextCharacter;
    }
    currentCPM = cpm.getCPM() === Infinity || isNaN(cpm.getCPM()) ? 0 : cpm.getCPM();
  }

  let currentCPM = 0;
  let numInCycle = 0;

  let threshInput = cpm.getCpmThreshold().toString();
  let minWidowInput = cpm.getMinWindow().toString();
  let maxWindowInput = cpm.getMaxWindow().toString();

  let refresher = false;

  const toast = getToastStore();

  onMount(() => {
    localStorage.getItem("learned") ? learned = JSON.parse(localStorage.getItem("learned") as string) : learned = [HIRAGANA[0], HIRAGANA[1]];
    localStorage.setItem("learned", JSON.stringify(learned));

    const unlearnedArray = HIRAGANA.filter((character) => !learned.includes(character));
    unlearned = new Queue<string>(unlearnedArray);

    numInCycle = learned.length;

    // Set the initial display
    currentDisplay[0] = learned[Math.floor(Math.random() * learned.length)];
    for (let i = 1; i < currentDisplay.length; i++) {
      let nextCharacter = learned[Math.floor(Math.random() * learned.length)];
      while (nextCharacter === currentDisplay[i - 1]) {
        nextCharacter = learned[Math.floor(Math.random() * learned.length)];
      }
      currentDisplay[i] = nextCharacter;
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

<div class="block sm:hidden">
    <h1 class="text-3xl text-center mt-8 p-4">
      HiraHero is not supported on mobile devices. Please use a desktop browser.
    </h1>
</div>
<div class="hidden sm:block pb-6">
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
                cpm.reset();
              }
            }}
          >
            Reset
          </button>
          <button
          class="btn btn-sm variant-ghost-surface"
          on:click={() => {
            if (confirm("Are you sure you want to enable all characters?")) {
              learned = HIRAGANA;
              localStorage.setItem("learned", JSON.stringify(learned));
              location.reload();
            }
          }}
        >
          Enable All
        </button>
        </svelte:fragment>
      </AppBar>
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
  
      <div class="w-3/4 flex justify-center mx-auto gap-4">
        <div class="mx-auto mt-6 flex-1">
          {#key refresher}
            <p>CPM Thresh ({cpm.getCpmThreshold()})</p>
          {/key}
          <div class="input-group input-group-divider grid-cols-[1fr_auto]">
            <input type="text" bind:value={threshInput} />
            <button class="variant-filled-secondary" on:click={() => {
              const conv = parseInt(threshInput);
              if (isNaN(conv) || conv <= 0) {
                const t = {
                  message: `Invalid CPM threshold`,
                  duration: 3000,
                  background: 'variant-filled-error'
                };
                toast.trigger(t);
                return;
              }
  
              cpm.setCpmThreshold(conv);
              refresher = !refresher;
  
              const t = {
                message: `CPM threshold set to ${conv}`,
                duration: 3000
              };
              toast.trigger(t);
            }}>
              Enter
            </button>
          </div>
        </div>
        <div class="mx-auto mt-6 flex-1">
          {#key refresher}
            <p>Min Window ({cpm.getMinWindow()})</p>
          {/key}
          <div class="input-group input-group-divider grid-cols-[1fr_auto]">
            <input type="text" bind:value={minWidowInput} />
            <button class="variant-filled-secondary" on:click={() => {
              const conv = parseInt(minWidowInput);
              if (isNaN(conv) || conv < 2) {
                const t = {
                  message: `Invalid min window size`,
                  duration: 3000,
                  background: 'variant-filled-error'
                };
                toast.trigger(t);
                return;
              }
  
              if (conv > cpm.getMaxWindow()) {
                const t = {
                  message: `Min window size must be less than or equal to max window size`,
                  duration: 3000,
                  background: 'variant-filled-error'
                };
                toast.trigger(t);
                return;
              }
  
              cpm.setMinWindow(conv);
              refresher = !refresher;
  
              const t = {
                message: `Min window size set to ${conv}`,
                duration: 3000
              };
              toast.trigger(t);
            }}>
              Enter
            </button>
          </div>
        </div>
        <div class="mx-auto mt-6 flex-1">
          {#key refresher}
            <p>Max Window ({cpm.getMaxWindow()})</p>
          {/key}
          <div class="input-group input-group-divider grid-cols-[1fr_auto]">
            <input type="text" bind:value={maxWindowInput} />
            <button class="variant-filled-secondary" on:click={() => {
              const conv = parseInt(maxWindowInput);
              if (isNaN(conv) || conv < 2) {
                const t = {
                  message: `Invalid max window size`,
                  duration: 3000,
                  background: 'variant-filled-error'
                };
                toast.trigger(t);
                return;
              } 
  
              if (conv < cpm.getMinWindow()) {
                const t = {
                  message: `Max window size must be greater than or equal to min window size`,
                  duration: 3000,
                  background: 'variant-filled-error'
                };
                toast.trigger(t);
                return;
              }
  
              cpm.setMaxWindow(conv);
              refresher = !refresher;
  
              const t = {
                message: `Max window size set to ${conv}`,
                duration: 3000
              };
              toast.trigger(t);
            }}>
              Enter
            </button>
          </div>
        </div>
      </div>
  
      <div class="mt-14 space-y-2 w-2/3 mx-auto">
        <h2 class="text-center text-xl">
          Gameplay
        </h2>
        {#key refresher}
        <p class="text-center">
          Type the character in the middle of the screen to progress to the next character.
          Once you reach {cpm.getCpmThreshold()} characters-per-minute (CPM) 
          with at least {cpm.getMinWindow()} typed characters 
          (with a max window size of {cpm.getMaxWindow()} previous types 
          and max difference of 5 seconds between each character typed), 
          you will progress to the next character, and the CPM will reset.
        </p>
        {/key}
        <p class="text-center">
          Progress is saved locally, so you can continue where you left off.
          You can reset your progress by clicking the "Reset" button in 
          the top right corner.
        </p>
      </div>
    </div>
</div>


<style lang="postcss">
  .character {
    transition: opacity 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
    font-size: 42px;
    padding: 0 10px;
  }
</style>