#!/usr/bin/env node
'use strict';

// Mechanical helper commands for qatlas run and qatlas team. All commands work
// in the git repo of --repo (default: current directory).
// Usage:
//   qatlas-run-tools.js probe --branch <branch> [--base <ref>] [--repo <path>]
//     Dry-run merge: does <branch> merge into <base> cleanly (default: origin/HEAD).
//     Output: {"result":"clean","base","branch","tree"} or {"result":"conflict",...,"files":[...]}.
//     Exit: 0 clean, 1 conflict, 2 usage error, 3 check not possible.
//   qatlas-run-tools.js ci-wait --pr <number> [--timeout <seconds>] [--interval <seconds>] [--repo <path>]
//     Waits via gh until no check of the pull request is running (default: timeout 3600, interval 20).
//     Transient gh errors are retried, at most 5 in a row.
//     A pull request without any check (gh "no checks reported", also an empty list) is not waited out: after
//     3 consecutive such polls (two intervals, since gh can report it briefly right after the PR is opened)
//     the result is "none".
//     Output: {"pr","result":"pass"|"fail"|"timeout"|"none","checks":[{name,bucket,link}],"retries"}.
//     Exit: 0 pass, 1 fail, 4 timeout, 8 none (no CI), 2 usage error, 3 gh missing, not logged in or persistently failing.
//   qatlas-run-tools.js land --pr <number> --report <file> [--no-ci] [--timeout <s>] [--interval <s>] [--repo <path>]
//     Integrates one pull request via gh: reads branch, pr-title and pr-body (and the optional head) from the
//     report frontmatter, checks that the PR head is the head the report vouches for (frontmatter "head",
//     else the local branch tip), waits for CI as ci-wait does, squash-merges with --match-head-commit (one
//     retry), proves the squash (merge tree equals PR head tree, else equal patch-id) and only then deletes
//     the remote branch. Does not open PRs or touch local worktrees/branches.
//     A PR head ahead of the vouched head is accepted if the vouched head is its ancestor and the commits in
//     between are merge commits or already on origin/<base> (e.g. GitHub "Update branch"); any new own
//     commit stays head-mismatch, as does a merge whose tree is not the conflict-free merge of its two
//     parents (needs git >= 2.38, else exit 3). The PR head is fetched via origin pull/<number>/head. Merge, proof and
//     deletion then use the PR head.
//     Without any check (see ci-wait) land does not merge: result "no-ci". With --no-ci the merger confirms
//     that the merged state was tested locally with the project tests; land then merges without CI. Checks
//     that do exist are still waited for.
//     Output: {"pr","result","merge_sha","proof":"tree"|"patch-id"|null,"branch_deleted",...}; result is
//     merged | ci-fail | timeout | no-ci | head-mismatch | merge-failed | proof-failed; "reason" explains failures.
//     Exit: 0 merged, 1 ci-fail, 4 timeout, 5 head-mismatch, 6 merge-failed, 7 proof-failed, 8 no-ci,
//     2 usage error (also missing frontmatter or field), 3 gh/git check not possible.
//   qatlas-run-tools.js slot [--slots <count>] [--priority] [--repo <path>] -- <command> [args...]
//     Runs the command once a test slot is free and releases the slot afterwards. Slot count:
//     --slots, else test-slots in ~/.qatlas/plugins/team.yaml, else 2. Waiting callers are
//     served in arrival order; --priority queues ahead of every caller without it.
//     Locks live in the primary working tree so worktrees see them. No JSON output;
//     the command exit code is passed through (signal: 128 plus signal number).
//   qatlas-run-tools.js slot [--slots <count>] [--repo <path>] status
//     Read-only view of the test slots; "status" without "--" (after "--" it is a command to run).
//     Output: {"slots","busy":[{slot,pid,started,cwd,command,orphaned}],
//     "waiting":[{priority,arrival,pid,cwd,command,orphaned}]}; unknown fields are null. Exit: 0, 3 no git repo.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn, spawnSync } = require('child_process');
const { parseFrontmatter } = require('./handover-frontmatter.js');

const argv = process.argv.slice(2);
const command = argv[0];
const sep = argv.indexOf('--');
const opts = sep >= 0 ? argv.slice(1, sep) : argv.slice(1);
const rest = sep >= 0 ? argv.slice(sep + 1) : [];
const flag = name => { const i = opts.indexOf(name); return i >= 0 ? opts[i + 1] : null; };

const out = value => process.stdout.write(JSON.stringify(value) + '\n');
const fail = (message, code = 1) => { process.stderr.write(message + '\n'); process.exit(code); };
const need = (...names) => names.map(name => flag(name) || fail('Missing: ' + name, 2));
const repo = path.resolve(flag('--repo') || process.cwd());
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const number = (name, fallback) => {
  const raw = flag(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  return /^\d+(\.\d+)?$/.test(raw) && value > 0 ? value : fail(`Invalid: ${name} needs a positive number`, 2);
};

const git = args => execFileSync('git', ['-C', repo, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).trim();

function probe() {
  const [branch] = need('--branch');
  let base = flag('--base');
  if (!base) {
    try { base = git(['rev-parse', '--abbrev-ref', 'origin/HEAD']); } catch { base = null; }
    if (!base || base === 'origin/HEAD') fail('origin/HEAD cannot be resolved; pass --base', 2);
  }
  const run = spawnSync('git', ['-C', repo, 'merge-tree', '--write-tree', '--name-only', '--no-messages', base, branch],
    { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (run.error || (run.status !== 0 && run.status !== 1)) {
    fail('Check not possible: ' + (run.error ? run.error.message : (run.stderr || '').trim() || 'Exit ' + run.status), 3);
  }
  const lines = run.stdout.split('\n');
  const tree = lines[0].trim();
  if (!/^[0-9a-f]{40,64}$/.test(tree)) fail('Check not possible: unexpected output from git merge-tree', 3);
  if (run.status === 0) { out({ result: 'clean', base, branch, tree }); return; }
  const files = [];
  for (const line of lines.slice(1)) {
    if (line === '') break;
    if (!files.includes(line)) files.push(line);
  }
  out({ result: 'conflict', base, branch, tree, files });
  process.exit(1);
}

// Polls the checks of a pull request until none is pending. Returns {state, checks, retries} with state
// pass, fail, timeout or none (no check at all, NO_CHECKS_POLLS polls in a row); exits 3 when gh is unusable.
const NO_CHECKS_POLLS = 3;
function waitForChecks(pr, timeout, interval) {
  const deadline = Date.now() + timeout;
  const view = list => list.map(({ name, bucket, link }) => ({ name, bucket, link }));
  let retries = 0, streak = 0, absent = 0, first = true, checks = [], lastError = '';

  for (;;) {
    const run = spawnSync('gh', ['pr', 'checks', pr, '--json', 'name,state,bucket,link'],
      { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 });
    if (run.error && run.error.code === 'ENOENT') fail('gh is missing; install the GitHub CLI', 3);
    const stderr = (run.stderr || '').trim();
    let parsed = null;
    try { parsed = JSON.parse(run.stdout); } catch { parsed = null; }
    if (Array.isArray(parsed)) {
      streak = 0;
      checks = parsed;
      absent = checks.length ? 0 : absent + 1;
      if (absent >= NO_CHECKS_POLLS) return { state: 'none', checks: [], retries };
      if (checks.some(c => c.bucket === 'fail' || c.bucket === 'cancel')) return { state: 'fail', checks: view(checks), retries };
      if (checks.length && !checks.some(c => c.bucket === 'pending')) return { state: 'pass', checks: view(checks), retries };
    } else if (/no checks reported/i.test(stderr)) {
      streak = 0;
      checks = [];
      if (++absent >= NO_CHECKS_POLLS) return { state: 'none', checks: [], retries };
    } else {
      if (first && /gh auth login|not logged in|authentication|GH_TOKEN/i.test(stderr)) {
        fail('gh is not logged in: ' + stderr, 3);
      }
      lastError = stderr || (run.error ? run.error.message : 'no valid JSON output');
      streak += 1;
      retries += 1;
      if (streak >= 5) fail('gh pr checks failed 5 times in a row: ' + lastError, 3);
    }
    first = false;
    if (Date.now() + interval > deadline) return { state: 'timeout', checks: view(checks), retries };
    sleep(interval);
  }
}

function ciWait() {
  const [pr] = need('--pr');
  if (!/^\d+$/.test(pr)) fail('Invalid: --pr needs a number', 2);
  const timeout = number('--timeout', 3600) * 1000;
  const interval = number('--interval', 20) * 1000;
  const { state, checks, retries } = waitForChecks(pr, timeout, interval);
  out({ pr: Number(pr), result: state, checks, retries });
  if (state !== 'pass') process.exit({ fail: 1, timeout: 4, none: 8 }[state]);
}

const LAND_EXIT = { merged: 0, 'ci-fail': 1, timeout: 4, 'head-mismatch': 5, 'merge-failed': 6, 'proof-failed': 7, 'no-ci': 8 };

function land() {
  const [pr, reportFile] = need('--pr', '--report');
  if (!/^\d+$/.test(pr)) fail('Invalid: --pr needs a number', 2);
  const timeout = number('--timeout', 3600) * 1000;
  const interval = number('--interval', 20) * 1000;
  const noCi = opts.includes('--no-ci');

  let text;
  try { text = fs.readFileSync(reportFile, 'utf8'); } catch (error) { fail('Report not readable: ' + error.message, 2); }
  let parsed;
  try { parsed = parseFrontmatter(text); } catch (error) {
    if (error.kind === 'load') fail('Check not possible: YAML parser not loadable (' + error.message + ').', 3);
    fail('Report frontmatter invalid: ' + error.message, 2);
  }
  if (!parsed) fail('Report has no frontmatter', 2);
  const field = key => typeof parsed.data[key] === 'string' && parsed.data[key].trim()
    ? parsed.data[key].trim() : fail(`Report frontmatter: "${key}" must be a non-empty string`, 2);
  const branch = field('branch'), title = field('pr-title'), body = field('pr-body');
  // Refs come from an untrusted report: they reach git only as arguments and may not start with "-".
  const safeRef = (ref, what) => ref.startsWith('-') ? fail(`Invalid: ${what} must not start with "-"`, 2) : ref;
  safeRef(branch, 'branch');
  const vouchedHead = parsed.data.head === undefined ? null : safeRef(field('head'), 'head');

  const gh = args => {
    const run = spawnSync('gh', args, { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 26 });
    if (run.error && run.error.code === 'ENOENT') fail('gh is missing; install the GitHub CLI', 3);
    return run;
  };
  const ghJson = (args, what) => {
    const run = gh(args);
    try { if (run.status === 0) return JSON.parse(run.stdout); } catch { /* handled below */ }
    return fail(`Check not possible: ${what} failed: ${(run.stderr || '').trim() || 'no valid JSON output'}`, 3);
  };
  const gitOr3 = args => {
    try { return git(args); } catch (error) {
      return fail('Check not possible: git ' + args[0] + ' failed: ' + ((error.stderr || error.message) + '').trim(), 3);
    }
  };
  const finish = (state, extra = {}) => {
    out({ pr: Number(pr), result: state, merge_sha: null, proof: null, branch_deleted: false, ...extra });
    process.exit(LAND_EXIT[state]);
  };

  // 2. The head the report vouches for must be the head GitHub will merge.
  const tryGit = args => { try { return git(args); } catch { return null; } };
  const tip = tryGit(['rev-parse', '--verify', '--quiet', branch + '^{commit}']);
  const vouched = vouchedHead === null ? tip : tryGit(['rev-parse', '--verify', '--quiet', vouchedHead + '^{commit}']);
  if (!vouched) fail(`Check not possible: ${vouchedHead === null ? 'branch ' + branch : 'head ' + vouchedHead} does not resolve to a commit`, 3);
  const info = ghJson(['pr', 'view', pr, '--json', 'headRefOid,headRefName,state,baseRefName'], 'gh pr view');
  if (info.state !== 'OPEN') finish('head-mismatch', { reason: `pull request is ${info.state}`, head: info.headRefOid, branch_sha: vouched });
  if (tip && tip !== vouched) finish('head-mismatch', { reason: 'report head differs from branch', head: info.headRefOid, branch_sha: tip });
  const base = safeRef(String(info.baseRefName || ''), 'base');
  if (!base) fail('Check not possible: pull request has no base branch', 3);
  // The PR head was moved on the remote (e.g. "Update branch"): accepted only if it adds nothing of its own
  // to the vouched head, i.e. every commit in between is a merge or already on origin/<base>.
  const sha = info.headRefOid;
  if (sha !== vouched) {
    if (tryGit(['fetch', '--quiet', 'origin', `pull/${pr}/head`]) === null || tryGit(['rev-parse', 'FETCH_HEAD^{commit}']) !== sha) {
      finish('head-mismatch', { reason: 'pull request head not fetchable', head: sha, branch_sha: vouched });
    }
    gitOr3(['fetch', '--quiet', 'origin', base]);
    const baseTip = gitOr3(['rev-parse', 'FETCH_HEAD^{commit}']);
    const ahead = tryGit(['merge-base', '--is-ancestor', vouched, sha]) !== null
      && tryGit(['rev-list', '--no-merges', `${vouched}..${sha}`, '^' + baseTip]) === '';
    if (!ahead) finish('head-mismatch', { reason: 'pull request head differs from branch', head: sha, branch_sha: vouched });
    // A merge in between must be a plain two-parent merge: its tree equals the conflict-free merge of its parents.
    for (const merge of gitOr3(['rev-list', '--merges', `${vouched}..${sha}`]).split('\n').filter(Boolean)) {
      const parents = gitOr3(['rev-list', '--parents', '-n', '1', merge]).split(' ').slice(1);
      const mismatch = reason => finish('head-mismatch', { reason: `merge ${merge} ${reason}`, head: sha, branch_sha: vouched });
      if (parents.length !== 2) mismatch('has ' + parents.length + ' parents');
      const run = spawnSync('git', ['-C', repo, 'merge-tree', '--write-tree', ...parents], { encoding: 'utf8', maxBuffer: 1 << 28 });
      if (run.error || (run.status !== 0 && run.status !== 1)) {
        fail('Check not possible: git merge-tree --write-tree failed (git >= 2.38 needed): ' + (run.error ? run.error.message : (run.stderr || '').trim() || 'Exit ' + run.status), 3);
      }
      if (run.status === 1) mismatch('has conflicts between its parents (resolution is an own change)');
      if (run.stdout.split('\n')[0].trim() !== gitOr3(['rev-parse', merge + '^{tree}'])) mismatch('contains changes beyond the merge of its parents');
    }
  }

  // 3. CI
  const ci = waitForChecks(pr, timeout, interval);
  if (ci.state === 'none' && !noCi) finish('no-ci', { checks: [], reason: 'no checks reported; test the merged state locally and repeat with --no-ci' });
  if (ci.state === 'fail' || ci.state === 'timeout') finish(ci.state === 'fail' ? 'ci-fail' : 'timeout', { checks: ci.checks });

  // 4. Merge with one retry; --match-head-commit refuses a head that moved after the comparison. A failed
  // call may still have merged on GitHub (e.g. a dropped connection), so the PR state decides.
  const mergeArgs = ['pr', 'merge', pr, '--squash', '--subject', title, '--body', body, '--match-head-commit', sha];
  const isMerged = () => {
    const run = gh(['pr', 'view', pr, '--json', 'state']);
    try { return run.status === 0 && JSON.parse(run.stdout).state === 'MERGED'; } catch { return false; }
  };
  let merged = gh(mergeArgs);
  if (merged.status !== 0 && !isMerged()) {
    sleep(2000);
    merged = gh(mergeArgs);
    if (merged.status !== 0 && !isMerged()) {
      finish('merge-failed', { reason: (merged.stderr || '').trim() || 'gh pr merge failed' });
    }
  }

  // 5. Squash evidence
  const view = ghJson(['pr', 'view', pr, '--json', 'mergeCommit'], 'gh pr view');
  const mergeSha = view.mergeCommit && view.mergeCommit.oid;
  if (typeof mergeSha !== 'string' || !/^[0-9a-f]{40,64}$/.test(mergeSha)) {
    finish('proof-failed', { reason: 'merge commit not reported by gh' });
  }
  const unproven = reason => finish('proof-failed', { merge_sha: mergeSha, reason });
  try { git(['fetch', '--quiet', 'origin', base]); } catch (error) {
    unproven('git fetch failed: ' + ((error.stderr || error.message) + '').trim());
  }
  if (tryGit(['merge-base', '--is-ancestor', mergeSha, 'FETCH_HEAD']) === null) {
    unproven(`merge commit is not on origin/${base}`);
  }
  let proof = null;
  if (tryGit(['rev-parse', mergeSha + '^{tree}']) === tryGit(['rev-parse', sha + '^{tree}'])) {
    proof = 'tree';
  } else {
    const patchId = diffArgs => {
      const diff = tryGit(['diff', ...diffArgs]);
      if (!diff) return null;
      const run = spawnSync('git', ['-C', repo, 'patch-id', '--stable'], { input: diff + '\n', encoding: 'utf8', maxBuffer: 1 << 28 });
      return run.status === 0 ? run.stdout.split(/\s/)[0] || null : null;
    };
    const mergeBase = tryGit(['merge-base', mergeSha + '^', sha]);
    const want = patchId([mergeSha + '^', mergeSha]);
    if (want && mergeBase && want === patchId([mergeBase, sha])) proof = 'patch-id';
  }
  if (!proof) unproven('merge commit content differs from the branch');

  // 6. Only with proof: delete the remote branch.
  let deleted = false, reason;
  try { git(['push', 'origin', '--delete', branch]); deleted = true; } catch (error) {
    reason = ((error.stderr || error.message) + '').trim();
  }
  const extra = deleted ? {} : { branch_delete_reason: reason };
  out({ pr: Number(pr), result: 'merged', merge_sha: mergeSha, proof, branch_deleted: deleted, ...extra });
}

function slotCount() {
  const given = flag('--slots');
  if (given !== null) return /^[1-9]\d*$/.test(given) ? Number(given) : fail('Invalid: --slots needs a positive integer', 2);
  const file = path.join(os.homedir(), '.qatlas', 'plugins', 'team.yaml');
  if (!fs.existsSync(file)) return 2;
  try {
    const { parseYamlText } = require('../../../scripts/runtime/config-loader.js');
    const value = parseYamlText(fs.readFileSync(file, 'utf8'), 2)['test-slots'];
    if (value === undefined) return 2;
    if (Number.isInteger(value) && value > 0) return value;
  } catch (error) {
    fail('team.yaml not readable: ' + error.message, 3);
  }
  return fail('Invalid: test-slots in team.yaml needs a positive integer', 3);
}

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
}

// Working directory and command of the caller, stored after the PID in owner files and tickets.
const detail = () => JSON.stringify({ cwd: process.cwd(), command: rest });
const readDetail = text => {
  try {
    const { cwd, command } = JSON.parse(text);
    return { cwd: typeof cwd === 'string' ? cwd : null, command: Array.isArray(command) ? command : null };
  } catch { return { cwd: null, command: null }; }
};
const slotDir = () => {
  let common;
  try { common = git(['rev-parse', '--path-format=absolute', '--git-common-dir']); } catch (error) {
    fail('Not a git repo: ' + repo, 3);
  }
  return path.join(path.dirname(common), '.qatlas', 'local', 'slots');
};
const ownerFile = lock => path.join(lock, 'owner');
const orphaned = lock => {
  let pid;
  try { pid = Number(fs.readFileSync(ownerFile(lock), 'utf8').split('\n')[0]); } catch {
    // Folder without owner file: orphaned only if older than a few seconds.
    try { return Date.now() - fs.statSync(lock).mtimeMs > 10000; } catch { return false; }
  }
  return !Number.isInteger(pid) || pid <= 0 || !alive(pid);
};

function slotStatus() {
  const slots = slotCount();
  const dir = slotDir();
  const list = folder => { try { return fs.readdirSync(folder); } catch { return []; } };
  const busy = list(dir).filter(entry => /^\d+$/.test(entry)).sort((a, b) => a - b).flatMap(entry => {
    const lock = path.join(dir, entry);
    let text = null;
    try { text = fs.readFileSync(ownerFile(lock), 'utf8'); } catch { /* no owner file yet */ }
    const lines = text === null ? [] : text.split('\n');
    const pid = Number(lines[0]);
    return [{
      slot: Number(entry),
      pid: Number.isInteger(pid) && pid > 0 ? pid : null,
      started: lines[1] || null,
      ...readDetail(lines[2]),
      orphaned: orphaned(lock),
    }];
  });
  const queue = path.join(dir, 'queue');
  const waiting = list(queue).sort().flatMap(entry => {
    const match = /^(\d+)-(\d+)-(\d+)$/.exec(entry);
    if (!match) return [];
    let text = '';
    try { text = fs.readFileSync(path.join(queue, entry), 'utf8'); } catch { /* ticket just removed */ }
    return [{
      priority: Number(match[1]) === 0,
      arrival: new Date(Number(match[2])).toISOString(),
      pid: Number(match[3]),
      ...readDetail(text),
      orphaned: !alive(Number(match[3])),
    }];
  });
  out({ slots, busy, waiting });
}

function slot() {
  const isStatus = sep < 0 && opts.some((arg, i) => arg === 'status' && !['--slots', '--repo'].includes(opts[i - 1]));
  if (isStatus) return slotStatus();
  if (!rest.length) fail('Missing: command after --', 2);
  const slots = slotCount();
  const dir = slotDir();
  fs.mkdirSync(dir, { recursive: true });

  const take = () => {
    for (let i = 1; i <= slots; i++) {
      const lock = path.join(dir, String(i));
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          fs.mkdirSync(lock);
          fs.writeFileSync(ownerFile(lock), `${process.pid}\n${new Date().toISOString()}\n${detail()}\n`);
          return lock;
        } catch (error) {
          if (error.code !== 'EEXIST') throw error;
          if (!orphaned(lock)) break;
          fs.rmSync(lock, { recursive: true, force: true });
        }
      }
    }
    return null;
  };

  // Ticket names sort by priority, then arrival; only the oldest live ticket may take a slot.
  const queue = path.join(dir, 'queue');
  fs.mkdirSync(queue, { recursive: true });
  const name = `${opts.includes('--priority') ? 0 : 1}-${String(Date.now()).padStart(15, '0')}-${process.pid}`;
  const ticket = path.join(queue, name);
  fs.writeFileSync(ticket, detail() + '\n', { flag: 'wx' });
  const first = () => fs.readdirSync(queue).sort().find(entry => {
    if (alive(Number(entry.split('-')[2]))) return true;
    fs.rmSync(path.join(queue, entry), { force: true });
    return false;
  }) === name;

  let lock = first() && take();
  if (!lock) {
    process.stderr.write(`Waiting for a free test slot (${slots} slots)\n`);
    while (!(lock = first() && take())) sleep(2000);
  }
  fs.rmSync(ticket, { force: true });

  let released = false;
  const release = () => { if (!released) { released = true; fs.rmSync(lock, { recursive: true, force: true }); } };
  const child = spawn(rest[0], rest.slice(1), { stdio: 'inherit' });
  let signalled = null;
  for (const name of ['SIGINT', 'SIGTERM']) {
    process.on(name, () => { signalled = name; child.kill(name); });
  }
  child.on('error', error => { release(); fail('Command could not be started: ' + error.message, 127); });
  child.on('exit', (code, signal) => {
    release();
    const name = signal || signalled;
    process.exit(code !== null ? code : 128 + (os.constants.signals[name] || 0));
  });
}

const commands = { probe, 'ci-wait': ciWait, land, slot };
if (!commands[command]) fail('Commands: ' + Object.keys(commands).join(', '), 2);
commands[command]();
