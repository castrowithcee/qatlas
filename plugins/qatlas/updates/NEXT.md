---
description: >
  Check instruction for devices set up by an earlier Qatlas version: configuration files that hold only
  shipped defaults may go.
license: MIT
type: policy
edit: locked
---

# Configuration holds only deviations

Qatlas ships every default. A configuration file is optional and holds only what deviates from them; setup
no longer writes one.

## Project

- `.qatlas/plugins/config.yaml` with only `format: 1` and the shipped values `secrets: block` and
  `personal-data: ask` may be deleted. Keep it if it expresses a deviation for this repo.

## Device

These points concern `~/.qatlas/` on this device. Change them only after approval; once a point is done
there, it no longer applies in any other repo.

- `~/.qatlas/plugins/config.yaml` with only the shipped values may be deleted. Keep it if it holds a
  deviation.
- `~/.qatlas/plugins/statusline.yaml` written by an earlier setup holds the shipped palette and every
  widget. If the user never changed it, offer to delete it: without the file every shipped widget appears,
  newly shipped ones included. Keep it if it holds the user's own choice.
