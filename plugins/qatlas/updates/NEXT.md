---
description: >
  Check instruction for existing projects after the device-wide role configuration was renamed to team.yaml
  with format 2.
license: MIT
type: rule
edit: locked
---

# Role configuration is now team.yaml

The device-wide file `~/.qatlas/plugins/orchestra.yaml` is now called `~/.qatlas/plugins/team.yaml` and
carries `format: 2`. `orchestrator` became `lead`, `supervisor` and `integrator` are new and take the same
value as `orchestrator` had, `workers` became `worker`; `profiles` and `test-slots` are unchanged. The session
start takes the old file over automatically: it makes a backup first, leaves the old file in place and names
it. Comments of the old file are not carried over; the new file gets a short comment header, and the
commented template lives at `store/config/team.example.yaml`.

- If `team.yaml` already exists, nothing is written. An invalid old file blocks the takeover and is reported.
- Nothing changes in this repo itself, and no project file is touched by this update.
- Once the user has checked the new file, offer to delete the old one; do not delete it yourself.
