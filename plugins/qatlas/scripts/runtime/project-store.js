'use strict';

// Runtime state of a project in ~/.qatlas/projects/<name>-uid<id>/. The id lives in the project at
// .qatlas/local/uid (ignored by git), so the state is found again after the project moves or is renamed.

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ID = /^[0-9a-f]{8}$/;
const FOLDER = /^.+-uid([0-9a-f]{8})$/;

const git = (dir, args) => execFileSync('git', ['-C', dir, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const readText = file => { try { return fs.readFileSync(file, 'utf8').trim(); } catch { return null; } };
const real = dir => { try { return fs.realpathSync(dir); } catch { return dir; } };
const projectsDir = () => path.join(os.homedir(), '.qatlas', 'projects');
const idFile = project => path.join(project, '.qatlas', 'local', 'uid');
const slug = name => name.toLowerCase().normalize('NFKD').replace(/[^\x00-\x7f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';

// The primary working tree of a git repo, else the nearest folder upwards with a .qatlas folder, else the
// start folder. The home folder is never a project, as ~/.qatlas is the user level. Null if there is none.
function projectDir(start) {
  let dir;
  try { dir = fs.realpathSync(path.resolve(start)); } catch { return null; }
  const home = real(os.homedir());
  let found = null;
  try {
    found = real(path.dirname(git(dir, ['rev-parse', '--path-format=absolute', '--git-common-dir'])));
  } catch {
    for (let d = dir, parent = null; d !== parent && !found; parent = d, d = path.dirname(d)) {
      if (d !== home && fs.existsSync(path.join(d, '.qatlas'))) found = d;
    }
    found = found || dir;
  }
  return found === home ? null : found;
}

// A repo without the Qatlas scaffold has no ignore rule for the folder; .git/info/exclude keeps it out of
// git status without touching a versioned file. Errors are ignored.
function excludeLocal(start) {
  const root = projectDir(start);
  if (!root) return;
  try {
    execFileSync('git', ['-C', root, 'check-ignore', '-q', '.qatlas/local/x'], { stdio: 'ignore' });
  } catch (error) {
    if (error.status !== 1) return;
    try {
      const file = git(root, ['rev-parse', '--path-format=absolute', '--git-path', 'info/exclude']);
      let text = '';
      try { text = fs.readFileSync(file, 'utf8'); } catch { /* no exclude file yet */ }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.appendFileSync(file, (text && !text.endsWith('\n') ? '\n' : '') + '/.qatlas/local/\n');
    } catch { /* ignored */ }
  }
}

const folders = () => {
  try { return fs.readdirSync(projectsDir()).flatMap(name => FOLDER.test(name) ? [{ id: name.match(FOLDER)[1], dir: path.join(projectsDir(), name) }] : []); } catch { return []; }
};

function findFolder(id) {
  const found = folders().filter(folder => folder.id === id);
  if (found.length > 1) throw new Error(`Project id ${id} belongs to several state folders: ${found.map(f => f.dir).join(', ')}`);
  return found.length ? found[0].dir : null;
}

// Keeps the id of a state folder whose stored path is this project, as long as exactly one does.
function linkedId(project) {
  const linked = folders().filter(folder => readText(path.join(folder.dir, 'path')) === project);
  return linked.length === 1 ? linked[0].id : null;
}

function newId() {
  for (;;) {
    const id = crypto.randomBytes(4).toString('hex');
    if (!folders().some(folder => folder.id === id)) return id;
  }
}

// The id is linked into place from a complete temp file: link fails with EEXIST if the file exists, so the
// first of several concurrent writers wins, the others adopt its id, and nobody sees an empty file.
function createId(project) {
  const file = idFile(project);
  excludeLocal(project);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const id = linkedId(project) || newId();
  const temp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temp, id + '\n');
    fs.linkSync(temp, file);
    return id;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    return readText(file);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

// Read access: the state folder of the project, or null if there is none. Creates nothing.
function readState(start) {
  const project = projectDir(start);
  const id = project && readText(idFile(project));
  return id && ID.test(id) ? findFolder(id) : null;
}

// Write access: creates id and folder when missing, keeps the stored project path current. Null if there is
// no project folder.
function ensureState(start) {
  const project = projectDir(start);
  if (!project) return null;
  let id = readText(idFile(project));
  if (id === null) id = createId(project);
  if (!ID.test(id)) throw new Error(`Invalid project id in ${idFile(project)}`);
  const dir = findFolder(id) || path.join(projectsDir(), `${slug(path.basename(project))}-uid${id}`);
  fs.mkdirSync(dir, { recursive: true });
  if (readText(path.join(dir, 'path')) !== project) fs.writeFileSync(path.join(dir, 'path'), project + '\n');
  return dir;
}

// Read access for diagnosis: all state folders with a valid id suffix, and the id stored in a project.
const stateFolders = folders;
const readId = project => readText(idFile(project));

module.exports = { projectDir, excludeLocal, readState, ensureState, stateFolders, readId };
