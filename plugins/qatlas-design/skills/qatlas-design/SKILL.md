---
name: qatlas-design
description: >
  Art direction for websites, distilled from a study of 247 curated gallery sites (One Page Love,
  Awwwards Sites of the Day). Deals researched directions (idea, composition, type, palette,
  photographs, section blueprints) from a library, enforces a strict no-slop house style with a
  real-browser inspector, and runs a look-and-fix loop on screenshots. Use this whenever you build,
  design, redesign, restyle, polish or review a landing page, marketing site, portfolio, product page,
  one-pager, hero or any public-facing web page, in any stack (HTML/CSS, React, Next.js, Vue, Svelte,
  Astro, Tailwind) — also when the user says a page looks generic, templated, "AI-made", sloppy, or
  asks to make it look designed, premium, award-level or less like every other site. Also for app
  screens: dashboards, admin and analytics views, settings, inboxes and other screens people work in,
  with their own run and rules.
attribution: github.com/Leonxlnx/taste-skill
---

# Qatlas Design

Replace every default with a decision. Take away the ornaments of the average generated page (the
small label over the headline, the row of icon cards, the soft gradient, the thin rules, the monospace
caption) and never fill the space with another ornament: fill it with substance. Set the type larger,
use whole fields of colour, show real pictures of this subject's world (found or drawn), and give every
section its full content. Do not trade substance for restraint; blind jurors prefer a richer page with
tells over an empty page without them.

In the commands below `<skill>` is this skill's folder. Run them from the project's root, so the
working files land in `.qatlas/local/qatlas-design/` there. The scripts need Node 22+ and an installed
Chrome, Edge or Chromium (set `CHROME_PATH` to its executable if they do not find it), and install
nothing. `assets.mjs` also needs network access; it uses no API keys.

## Page or app screen

Decide first which of two kinds of work this is.

- **A page** is read and scrolled: a landing page, a marketing or product site, a portfolio, an
  event, a restaurant, a one-pager. It follows **the run** below.
- **An app screen** is worked in: a dashboard, an admin or analytics view, settings, billing, an inbox
  or queue to work through, a wallet, a list with filters, an editor or builder. It follows
  `references/app-screens.md`, with its own run, draw (`draw.mjs --app`), house rules and
  `inspect.mjs --app`. Read that file whole before you start; the page run below does not apply.

A product site that shows its app is a page; the interface fragments on it follow the app-screen
rules for their insides and are built as `references/imagery.md` §7 says. When a request holds both
(a landing page and the dashboard behind it), build each with its own run and one shared palette and
typeface.

## The run

Do these in order. Steps 1–5 take a few minutes and decide whether the page is any good.

### 1. Read the brief and the project

Find out what is real: the subject, the audience, the one thing the page must get someone to do, the
stack, any existing brand (colours, fonts, logo), and above all **what imagery truly exists**: the
project's own photographs or product shots, a real interface that can be shown, an image generation
tool you can call, or nothing. Do not plan around pictures you do not have. Nothing of its own is
rarely nothing at all: the subject's city, street, materials and history are in open archives and
museums, free to use with a credit (step 6, `scripts/assets.mjs`).

If the request is vague, decide and state your reading in one line instead of asking. Ask only when a
missing fact blocks the work (for example, no product name).

Then **inventory the subject** in your notes: eight to twelve things that belong to this client and to
no competitor. Look for its name and what the name means; its address, door number, street and
neighbourhood, and what that place looks like (its tiles, signs, paint colours, typefaces on its shop
fronts, its light, its weather); the numbers in the brief (seats, rooms, minutes to the sea, the
price, the year); the constraint it lives with (only one batch a month, closed in winter, by
appointment); its materials and colours; its rituals and hours (the oven lit at five, the ferry at
seven); the printed things of its world (a timetable, a label, a ticket, a sign). This list is where
the idea comes from in step 4: in blind tests the winning page was built from an item on such a list,
and a good composition with a category idea lost. The list is also your picture search: each place,
material and printed thing on it is a query for step 6.

### 2. Write the argument

Before any design, list the page as claims with their proof, one line per section, the way
`references/copy.md` §1 shows. The claims decide which sections exist and in what order. Delete any
section that has no claim.

### 3. Draw the direction

```bash
node <skill>/scripts/draw.mjs --sector <sector> --brief "<one line about the subject>" \
  --sections <roles in the order of your argument> [--tone <tone>] [--have <assets>] [--keep palette,type] \
  --options 3
```

This deals three directions and prints a short summary of each. Hold each one against your inventory:
which way of composing can carry something only this client has? Choose that one, not the most
familiar, and write one line in your notes on why; a direction that does not suit the subject is the
commonest cause of a weak page. Then deal the full sheet:

```bash
node <skill>/scripts/draw.mjs <the same arguments, without --options> --direction <chosen id>
```

- `--sector`: `node <skill>/scripts/draw.mjs --list sectors`. Pick the closest.
- `--sections`: roles from `--list roles` (features, showcase, how-it-works, testimonial, proof, stats,
  pricing, faq, cta, footer, intro, about, work, gallery, list, contact). The hero is implied.
- `--tone` (optional): quiet, bold, warm, technical, playful, luxury, editorial. Only pass it when the
  brief clearly asks for one.
- `--have`: only the assets that really exist, comma-separated: `photography` (the project's own
  photographs of the place, people or work), `product-photo` (photographs of the specific product, or
  an image tool that can make them), `product-ui` (real screenshots), `illustration`, `video`. Leave it
  out if you have none; what counts is in `references/imagery.md` §2.
- `--keep palette,type`: when the brand already fixes colours or typefaces. The draw then deals only
  the composition, and you map the brand's values onto the roles.

The command prints a **direction sheet**. It is the art direction for this build:

- **Adopt it.** Do not blend it with the layout you would have made anyway. If it feels unfamiliar,
  good: the familiar layout is the one to avoid.
- Redraw one slot (`--redraw hero | type | palette | photos | section:<role> | direction`) only for a
  reason you can state: it contradicts a stated brand constraint, or needs an asset that does not
  exist. Never redraw to get something more comfortable. Record every redraw in your report.
- When a dealt section cannot hold the real content (it compares three plans and there is one price;
  it wants five quotations and there are none), do not bend the content to fit. List the others with
  `--alternatives <role>`, pick the one whose assumptions match the content, and take it with
  `--redraw section:<role>=<id>`.
- **Check the palette against the subject.** A dealt palette is a set of proportions (one ground, one
  ink, one accent, fields) as much as a set of colours. If its colours fight the subject's own material
  (candy pastels for a peat whisky, neon for a mountain hut), redraw the palette once; if the subject
  has unmistakable colours of its own (its material, the paint of its street, the landscape outside
  its windows), keep the dealt proportions and take the colours from the subject instead, and say so
  in the report.
- Reprint it any time with `node <skill>/scripts/draw.mjs --show`. In a long session, re-read it before each
  section you build.

### 4. Find the idea

The direction is a way of composing. The idea is what makes the page belong to this subject and no
other. Write this sentence in your notes and do not start building until both blanks are filled from
the subject itself:

> On this page, **[something that belongs to the subject]** becomes **[the device the direction calls for]**.

Places to look for the first blank:

- **Its output.** What does the thing produce? Put the real output on the page as material. (A camera
  that prints poems delivered its copy as paper slips.)
- **Its object or shape.** What does it physically look like, in cross-section, in silhouette?
  Enlarge it, crop it, make it the frame or the one motif.
- **Its name.** Can the letters hold a photograph, stack into a wall, split to two corners?
- **Its place.** Is there one view that makes someone want to be there?
- **Its ritual.** Is there a sequence the page can perform as it scrolls?
- **Its artefact.** What printed thing already exists in its world: ticket, menu, label, receipt,
  invitation, folder, manual?
- **Its opposite.** Which other category owns the feeling this one lacks?

Fill the first blank from your inventory (step 1), not from the category. **The competitor test:** put
the nearest real competitor in the sentence (the bakery two streets away, another oak furniture maker,
another hut on the same mountain). If the sentence still works, the idea belongs to the category: a
loaf of bread is every bakery; the seven doors of the street this one is named after are only this one.
"Clean and modern" is not an idea. The sites the study's panel scored lowest were the ones whose idea
was recorded as "none beyond the standard formula".

**One live thing.** Give the page one thing the visitor can do, or that is different for each visit,
made from the idea: pick a wood and see the chair in it; type your name and see it cut in the
foundry's letters; set the loan and read the real monthly figure; see whether the hut's stove is lit
right now and how long until the last ferry; choose a size and see it against the room. In blind tests
every winning page had one and the jurors named it first. Rules: it uses the subject's real content,
it works on a phone with a thumb, it has a plain fallback without script, it never blocks reading, and
it is one thing, not a playground. It is built in step 6 as part of the page, not added as motion in
step 9.

### 5. Write the words

Write the whole page as a copy deck (plain text) before markup, following `references/copy.md`:

- **Every headline fits in two lines or fewer at every width.** Do the arithmetic in copy.md §2 before
  committing to a sentence.
- **One supporting sentence and one primary action** go with the headline on the first screen, placed
  as copy.md §4 says.
- **The first screen answers the visitor's first question in large type.** For an event: what it is,
  when and where (the dates in the headline or at the second size, never only in small text). For a
  product: what it is and what it costs or does. For a person: who and what they do. Every section the
  visitor came for (the line-up, the menu, the rooms, the price) has its own heading and its own place
  in the navigation.
- **Write the full content.** Every section the brief asks for delivers its information completely:
  the whole menu with prices, each room with its own details, every speaker and talk, the price with
  what it includes, an answer for each real question. Thin sections are the commonest reason a clean
  page loses to a busier one.
- **Sample details yes, invented proof never** (copy.md §5).

### 6. Build it, still

Build the page with motion switched off in your head; a page that needs animation to look finished is
not finished. Order of work:

1. **Tokens.** Colour and type roles from the sheet as CSS custom properties. Everything downstream
   references tokens only. `<skill>/assets/base.css` is a neutral foundation you may start from (reset, token
   names, fluid type steps, grid, focus and selection styles, the motion helpers); it has no look of
   its own.
2. **The hero, exactly as the blueprint describes it,** at desktop and at phone width. Get the big
   thing big and the small things small before anything else exists.
3. **Each section from its blueprint,** with this project's content. Keep the geometry, change the
   subject. Neighbouring sections must not share a layout, and the idea reaches every section, pricing,
   FAQ and footer included (`references/layout.md` §6).
4. **Imagery,** in the order of preference in `references/imagery.md` §2. Search the open collections
   from your inventory, not the category, with `node <skill>/scripts/assets.mjs "<query>"` (imagery.md
   §3), and draw in code only what no honest picture exists of (§8).

   **The floor, which the inspector checks:** at least four real pictures on the page, usually six to
   twelve (photographs, archival images, maps, engravings, footage, raster artwork; for software, its
   cropped interface fragments count too). SVG drawings do not count toward the floor: draw what no
   picture exists of, and still carry real pictures. Add one moving picture wherever an honest clip
   exists (`assets.mjs --video`, imagery.md §11). Models skip pictures and footage because finding
   them is work; the page fails without them.
5. **The live thing** from step 4, built into the section where it proves the claim (often the hero
   or the booking), with real content, a thumb-sized phone version and a plain fallback.
6. **A scroll scene,** only where one of the page's big moments needs the screen to hold while the
   page scrolls (a camera flying through the work, a picture opening to the whole screen). Build it
   yourself on the shared stage in `<skill>/assets/scenes/`, with the section it carries and this
   project's own pictures and words, as `references/scenes.md` says. A scene decides how long the page
   is and what each screen shows, so build it now and see it in every look round.
7. **Fullness.** Look at each desktop screen as a poster: one dominant thing and the content it
   carries. A screen that is mostly empty ground is an underbuilt section, not a rest; one deliberate
   rest per page is the limit (`references/layout.md` §4).
8. **The frame,** by the house rules below: equal outer margins, every section using the width the page
   has set up, no blank stretch, a heading on every section, an `h1` on the first screen.
   `references/layout.md` §4–5 has the measures.
9. **States and semantics.** Real links and buttons, visible focus, alt text, a phone layout that is
   its own composition.

Take the detail behind every type, colour and layout decision from `references/type.md`,
`references/colour.md` and `references/layout.md`.

### 7. Gate

```bash
node <skill>/scripts/lint.mjs <source files or folder>
node <skill>/scripts/inspect.mjs <url or path/to/index.html>
```

With a scroll scene on the page, also run `scenes.mjs` and pass `--film` to `inspect.mjs`
(`references/scenes.md` §6).

`lint.mjs` checks the source for banned patterns and stock phrases; `inspect.mjs` renders the page at
1440, 768 and 390 pixels, measures the house rules and the frame, and saves screenshots to
`.qatlas/local/qatlas-design/inspect/`. Fix every `FAIL`. Treat each `WARN` as wrong unless you can
defend it to a designer in one sentence. Re-run until there are no `FAIL`s. Do not argue with the
meter and do not hide things from it. The inspector serves local files over a throwaway local server;
if the page must also open straight from the file system, open `index.html` that way once before you
finish.

### 8. Look

Passing the gate means nothing banned was measured. It does not mean the page is good. Open the
screenshots the inspector lists (every viewport, with your image viewer or Read tool) and critique them
with `references/critique.md`: the fourteen passes, the Awwwards-weighted score, the caps. Write the critique
down in its format, fix the top three problems, run the inspector again, look again. Three rounds at
most.

Judge only the pictures. If a problem is visible in a screenshot, it is real, whatever the code says.

### 9. Move

Now build the motion layer from `references/motion.md`: its parts in §1, the recipes in §6, the rules
in §10. It is required, and it is more than one fade: the inspector fails a page on which fewer than
eight elements move. A move that changes the colour or the layout of whole screens (colour by chapter,
a pinned story, a scroll scene) is composition, so build it in step 6 and let every look round see it.
Then run the inspector once more and check every screenshot for content that failed to appear.

### 10. Report

Do not report until all of these are true:

- `inspect.mjs` shows **0 FAIL** at 1440, 768 and 390, on the final version of the page.
- You opened every screenshot it listed after the last change, not only the first screen.
- With a scroll scene: `scenes.mjs` ran on the final page with no problems, and you read every sheet
  (desktop, phone, reduced motion).
- A stranger reading the first screen for five seconds can say what this is and what to do.
- Every section has a heading; the margins match on both sides; no stretch of the page is empty.
- The critique of your last round is written down in the shape of `references/critique.md` §4.

Tell the user, briefly: the direction dealt (name and seed) and any redraws with reasons; the idea
sentence and the live thing; the final scores from your last critique round and what still falls short;
every found picture and clip with its title, creator, licence and source page (`assets.mjs --credits` prints
the list) and where its credit sits on the page; which bundled photographs and which drawings stand in
for photography (so they can be replaced); and any sample content that must be swapped before launch.
Do not claim a check you did not run.

## House rules

These hold on every build, whatever the direction. `inspect.mjs` measures them.

| Rule | Instead |
| --- | --- |
| **Headlines: two lines or fewer, at every width.** Every `h1`–`h6`, and the main line of the first screen whatever its tag. | Cut words. Then widen the measure. Size last. |
| **A clear title on the first screen**, in the page's one `h1`, and a heading on every section. | Say what this is: the name with what it does, the product with what it is for, the event with its date and place. |
| **Equal outer margins; no section huddled on one side** with the other half of the screen empty. | Close every void with something on its far side: the section's picture, a second column, a list, a figure. |
| **No blank stretches** taller than about half a screen. | The normal section gap. A deliberate rest is a placed picture or a field of colour, once per page. |
| **Statements are paragraphs** at statement size (`references/copy.md` §2). | Larger than that it is a headline and the two-line rule applies. |
| **No eyebrows.** No small label above a heading, no pill badge above the headline, no "New ·" chip. | Put the information in the heading or the first sentence, or drop it. |
| **No monospace** outside real code blocks. | The text face. Tabular figures where numbers align. |
| **No index numbering.** No 01 / 02 / 03, no (001), no "Step 2". | Order shown by position, size, or the words. A real `<ol>` if order matters. |
| **No thin rules.** No hairline dividers, no 1px outlined boxes, no grid lines, crosshairs or crop marks. | Space. A step in background tone. A change of scale. A filled shape. |
| **No gradients.** Not as backgrounds, not on buttons, not in text. | Flat colour, or a real photograph. A neutral scrim under text on a photo is the one exception. |
| **No shadows on things at rest.** No glows. | A tone step between surfaces. Shadows only on what truly floats: a menu, a dialog. |
| **No assistant palette.** No yellow-cream ground with terracotta or rust; no violet or indigo. | The dealt palette. |
| **No tiny uppercase letter-spaced labels.** | Sentence case at a readable size. |
| **No icon-topped feature cards, no rows of identical cards.** | The dealt section blueprint. |
| **No glass.** No backdrop blur panels, no floating pill navigation. | A plain bar: wordmark, a few links, one action. |
| **No emoji, no gradient blobs, no decorative shapes, no fake dashboards of grey bars.** | A real picture, a real interface fragment, or nothing. |
| **No styled accent word** in a headline (italic, serif, coloured, underlined). | One face, one colour. The words carry the emphasis. |
| **Two typefaces at most,** usually one. | The dealt type system. |

Three places keep their own conventions and are left alone by the inspector: real code in
`<pre>`/`<code>` (monospace is correct there), real tables and form fields (they may have lines), and
a real interface fragment whose root carries the attribute `data-ui` (the product's own borders and
menus; see `references/imagery.md` §7).

Apply these rules without exception, also where gallery fashion uses the device;
`references/tells.md` has the dated registry with the reasons.

## Special cases

**An existing brand or design system.** Pass `--keep palette,type`, map the brand's colours and faces
onto the roles, and take only composition from the draw. The house rules still apply; if the brand
itself requires a banned device (its logo sits in a gradient, its accent is violet), keep the brand
asset, say so in the report, and pass `--allow <rule>` to the inspector for that rule only.

**Redesign, restyle or review of an existing page or app screen.**

1. **Record the before.** Run the project as it is and inspect it into its own folder
   (`inspect.mjs <url> --out .qatlas/local/qatlas-design/before`, with `--app` for an app screen) and
   lint its source. Read the code: the framework, the styling method (Tailwind v3 or v4, CSS modules,
   styled-components, plain CSS), the components, and what must survive: routes, forms, data,
   behaviour, the brand's own assets.
2. **A review stops here.** Critique the before screenshots with `references/critique.md`, list the
   findings with the inspector's measurements, and name the three changes that would move the page
   most.
3. **Keep the stack, the content and what works.** No framework or styling-library migration; check the
   dependency file before adding anything. A restyle keeps the layout and takes type, colour and
   components from a dealt direction (`--keep` whatever the brand fixes); a redesign deals a full
   direction and rebuilds the sections from its blueprints inside the existing components. Either way
   proceed from step 2 of the run with the page's real content.
4. **Order of work, biggest effect for least risk:** type (faces and scale), colour (one ground, one
   ink, one accent), the frame (margins, section rhythm, a title on the first screen and a heading on
   every section), states (hover, focus, loading, empty, error), then the stock components (icon
   cards, pill badges, gradient blobs, card grids) replaced by the dealt blueprints.
5. **Prove it.** Inspect again into `.qatlas/local/qatlas-design/after`, compare before and after at
   every width, click through every link, form and menu that worked before, and report the before and
   after measurements side by side.

**A component or a single section, not a page.** Skip the draw unless there is no direction to follow.
Match the surrounding design, apply the house rules, and still inspect the result.

**No checkout, no form backend.** The primary button goes to the real destination when the brief names
one. Otherwise it opens an email with a written subject and body (`mailto:` with the visitor's choices
filled in), or, for a shop, it points at `#checkout` and the report says it must be wired before
launch. Never fake a payment form.

**No Chrome or Node 22.** Run `draw.mjs`, `lint.mjs` and `assets.mjs` (Node 18+), take screenshots with
whatever browser tool you have, and critique those. Say in the report that the inspector could not run.

**No network.** If `assets.mjs` reaches no source, draw the pictures and say in the report that the
open collections could not be searched.

## Files

| File | Read it when |
| --- | --- |
| `references/app-screens.md` | Any dashboard, admin, settings or other app screen: its own run, rules, tokens and checks. |
| `references/copy.md` | Writing the argument and the copy deck (steps 2 and 5). The two-line arithmetic, statements, proof. |
| `references/type.md` | Setting type: scales, tracking, measure, loading fonts, pairing. |
| `references/colour.md` | Applying the palette: roles, proportions, tone steps, dark pages, contrast. |
| `references/layout.md` | Grid, margins, rhythm, empty space, the frame, section variety, navigation, footer, the phone composition. |
| `references/imagery.md` | Choosing, finding, crediting, cropping and treating pictures and footage; showing software; what to do with none. |
| `references/motion.md` | Step 9. Budget, tokens, recipes, reduced motion. |
| `references/scenes.md` | Step 6, when a big moment needs a scroll scene: building one on the stage, filling, fitting, the phone, checking. |
| `references/critique.md` | Step 8. How to look, how to score, what to fix first. |
| `references/tells.md` | The dated registry of generated-page tells and what each is replaced by. |
| `references/research.md` | The study: method, numbers, what the best and worst sites do. Cite it, do not guess. |
| `scripts/draw.mjs` | Deals and reprints the direction; `--photos`, `--site <id>` for more references; `--app` deals an app style instead. |
| `scripts/assets.mjs` | Step 6: searches open collections for real pictures and footage of the subject's world; `--get` downloads with the credit, `--credits` prints them. |
| `scripts/lint.mjs` · `scripts/inspect.mjs` | The gate. |
| `scripts/scenes.mjs` | The gate for scroll scenes: each scene at 0-100% of its hold, desktop, phone, reduced motion. |
| `assets/base.css` · `assets/base.js` | An optional neutral foundation to build on. |
| `assets/scenes/` | The shared stage for scroll scenes (`stage.js`, `stage.css`). |
| `assets/app.css` · `assets/charts.js` | For app screens and interface fragments: a neutral shell, panels, tables and controls, and small SVG charts drawn to the app rules. |
| `library/` | The data the draw reads: directions, heroes, sections, type systems, palettes, photographs, studied sites, motions, and the app styles, shells and screen patterns (`app.json`). Do not read it whole; use the script. |
