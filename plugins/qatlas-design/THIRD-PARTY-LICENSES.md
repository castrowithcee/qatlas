---
description: >
  Original copyright and MIT license notice for content taken from Leonxlnx/taste-skill, and the
  services and libraries the pack loads at run time without shipping them.
---

# Third-Party Licenses

## taste-skill

Source: https://github.com/Leonxlnx/taste-skill/tree/6010f91a9935f1c167dfc500fb1a475681892e6b/skills/taste-skill
License: https://github.com/Leonxlnx/taste-skill/blob/6010f91a9935f1c167dfc500fb1a475681892e6b/LICENSE

The `qatlas-design` skill is based on this project's skill folder.

Adapted from version 2.1.4, modified.

MIT License

Copyright (c) 2026 Leonxlnx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Services and libraries loaded at run time

None of these is shipped with the pack. The scripts or the built page fetch them from their own
servers, and each is used under its own terms and license.

- Lorem Picsum (picsum.photos), serving photographs from Unsplash: the placeholder photographs dealt on
  a direction sheet and linked from the built page.
- Google Fonts and Fontshare: the typefaces dealt on a direction or app sheet, linked from the built
  page.
- GSAP with its ScrollTrigger and SplitText plugins, and Lenis, loaded from cdn.jsdelivr.net: motion,
  scroll scenes and smooth scrolling on the built page.
- Openverse, Wikimedia Commons, the Art Institute of Chicago, The Metropolitan Museum of Art, the
  Internet Archive and the NASA Image and Video Library: the open collections `scripts/assets.mjs`
  searches and downloads pictures and footage from. Each downloaded file keeps the license its source
  states, recorded in the project's `assets/credits.json`.
