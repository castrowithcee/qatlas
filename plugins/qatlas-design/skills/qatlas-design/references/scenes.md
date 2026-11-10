---
description: >
  Scroll scenes on a page: building a held, scroll-scrubbed scene on the shared GSAP stage
  (stage.js, stage.css), filling and fitting it, its phone and reduced-motion plans, and checking it
  with scenes.mjs.
---

# Scroll scenes

The big moments of a page: stretches of scroll where the page stops being a column of sections and
becomes a scene. A camera flies through a field of pictures, a picture grows from a window to the whole
screen, a word buckles under the scroll, a set of photographs orbits and lands in a grid. These are what
visitors remember from award sites, and what a page built from tidy sections alone never has.

## Contents

1. What a scene is
2. Building one on the stage
3. Filling it
4. Fitting it to the page
5. The phone, reduced motion, no script
6. Checking it
7. Rules for scenes

## 1. What a scene is

A tall section whose stage holds still while the page scrolls past it. The stage is
`position: sticky`; the section is (hold + 1) screens tall, so the stage is held for `hold` screens;
a GSAP timeline is scrubbed from 0 to 1 by that scroll. Nothing captures the wheel: the scrollbar always
tells the truth, the keyboard and the trackpad work as everywhere else, and the scene ends.

What a scene is not: a fade-up, a small parallax, a sticky footer, a marquee. Those are the quiet layer
(`references/motion.md`). A scene changes the whole screen.

Place each scene on the section of the argument it can carry, and build it in step 6 with that
section: a scene is composition, not decoration added at the end.

## 2. Building one on the stage

Copy the shared stage into the project (`<skill>/assets/scenes/stage.css` and `stage.js`; the header
comment of `stage.js` lists its API) and write each scene as its own pair of files, `scenes/<id>.js`
and `scenes/<id>.css`. The script registers the scene on the stage, so it inherits the guards:

```js
Scenes['<id>'] = (root, opts = {}) => Stage.scene(root, {
  hold: opts.hold ?? 2,          // screens the stage is held for
  scrub: opts.scrub ?? true,     // true when Lenis runs; 0.4-0.8 without it reads as weight
  phone: 'same',                 // or 'rest', or { hold, build } for a phone plan
  build(tl, { q, phone }) {      // positions are fractions of the scene, 0-1
    tl.fromTo(q('.picture'), { clipPath: 'inset(30% 30% 30% 30%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6 }, 0)
      .to(q('.title'), { yPercent: -40, autoAlpha: 0, duration: 0.25 }, 0.7);
  },
});
```

Write the CSS for the finished composition first, then the live layout under `.scene.is-live`. Start
the scene file with a comment that lists the markup it expects and its options. Then put it on the
page:

```html
<head>
  <script>document.documentElement.classList.add('js')</script>
  <link rel="stylesheet" href="scenes/stage.css">
  <link rel="stylesheet" href="scenes/<id>.css">
</head>
<body>
  …
  <section class="scene" data-scene="<id>" data-options='{"hold": 3}' aria-label="…">
    <div class="scene-stage">
      <!-- the markup the scene file expects, filled with this page's content -->
    </div>
  </section>
  …
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js"></script>
  <script src="scenes/stage.js"></script>
  <script src="scenes/<id>.js"></script>
  <script>Stage.smooth(); Stage.init();</script>
</body>
```

- Load SplitText (`gsap@3.15.0/dist/SplitText.min.js`) only when a scene splits text with
  `Stage.split`.
- `Stage.smooth()` adds weighted wheel scrolling (Lenis at lerp 0.12). It stays off for touch and for
  reduced motion. Leave it out on a quiet page; the scenes work either way.
- `Stage.init()` starts every `[data-scene]` on the page. A page with two scenes loads both files.
- The versions are pinned. Do not change them to `@latest` or an unpinned major.

## 3. Filling it

A scene is only as strong as what goes in it. Decide how many pictures and words it takes from the
story it tells; these hold for all of them:

- **Pictures of one family.** Same light, same grade, same kind of subject: a field of mismatched stock
  photographs breaks the illusion of one space faster than any timing error. Real pictures of the
  subject's world (`assets.mjs`), the project's own, or the dealt photographs, in that order
  (`references/imagery.md`). Size each to its largest display size, set `width` and `height`.
- **Words that read in a breath.** A held statement is 4 to 12 words; captions are one to four words in
  the text face, sentence case. One statement on screen at a time.
- **The scene says something about the subject.** Decide what it shows from your inventory before
  building: a fly-through of the studio's own work, the route a shipment really takes, the four rooms
  of the house, the product's change of state. A scene filled with pictures that could belong to anyone
  is a screensaver.
- **Real content only.** If the scene needs eight pictures of the subject and there are three, change
  the scene to fit three or leave it out; never pad it with stand-ins.

## 4. Fitting it to the page

- Write the scene's CSS against the page's tokens (`references/colour.md` §2, `references/type.md`
  §5), with fallbacks, so the scene takes the page's colour and type.
- Display type in a scene uses the dealt display face and the two-line headline rule; statements stay
  at statement size.
- Leave a quiet section between two scenes (a text section, a list, a plain picture) so each one lands.
  Two scenes back to back read as one long ride and the second loses.
- A scene on the first screen must be readable at progress 0: the title, the sentence and the action are
  there on the first frame (motion rule 1), and the scene starts moving only when the visitor scrolls.
- Give the section a heading. If the design has no visible heading in the scene, the section still
  carries one (`aria-label` on the section and a real heading in the finished composition).

## 5. The phone, reduced motion, no script

- **The phone.** Give each scene a phone plan: the same scene with changed numbers, a simpler version,
  or `phone: 'rest'`, where the phone shows the finished composition. Touch scrolling is never
  smoothed. Look at the phone sheet as carefully as the desktop one.
- **Reduced motion and no script.** The section is an ordinary section showing the finished
  composition: the same content, laid out to read without motion. Nothing is hidden waiting for a
  script. The inspector's `reduced-hidden` check and the reduced sheet of `scenes.mjs` show it.
- **A failed CDN** falls back to the finished composition too (the stage adds `.is-rest`). The
  inspector fails a scene that rests on desktop (`scene-not-live`), so a broken script cannot pass.

## 6. Checking it

```bash
node <skill>/scripts/scenes.mjs <page>          # every scene at 0, 10 … 100%, desktop and phone, and reduced motion
node <skill>/scripts/inspect.mjs <page> --film  # the gate, plus a film of the whole scroll
```

`scenes.mjs` writes one contact sheet per scene and width to `.qatlas/local/qatlas-design/scenes/`.
Read every one. At every frame ask: is there one clear thing to look at; can the statement on screen be
read; is anything popping, blank, cut off or crossing the words; is it as bold as it should be? A scene
that never started or rests on desktop is a problem in `scenes.mjs` and a `FAIL` in the inspector. The
inspector's `desktop-film-NN.jpg` shows the whole page's scroll a third of a screen at a time: check
that the scenes and the quiet sections between them make a rhythm, and that nothing between them is
empty.

## 7. Rules for scenes

1. **Three per page at most,** each of a different kind, a quiet section between them. The inspector
   warns over four (`many-scenes`) and when scenes hold more than 60% of the page (`scene-heavy`).
2. **Each holds one to four screens:** about one screen per beat of the story; a hold with nothing new
   to show is cut, not padded.
3. **Native scroll only.** No wheel capture, no locking the page, no scenes that only run on a click.
   Smoothing only through `Stage.smooth()`.
4. **Readable at its rest points.** The statement on screen reads whole; nothing passes over text while
   it is being read; text on a picture has a flat scrim or a calm area under it.
5. **Inside a scene the scene's numbers apply** (motion rule 7): a picture may grow from a window to the
   whole screen, type may cross the stage, a camera may fly through pictures. Outside scenes, the quiet
   limits of `references/motion.md` hold.
6. **Transform, opacity, clip-path.** Nothing that forces layout on every frame. Pictures decoded before
   they move.
7. **The house rules hold inside scenes:** no monospace captions, no 01/07 counters (a plain "3 of 7" if
   a count is needed), no gradients (flat scrims), no shadows or glows, no hairline decoration, no
   decorative particles, no violet.
8. **The finished composition is designed,** not an afterthought: it is what reduced motion, a failed
   script and some phones see.
