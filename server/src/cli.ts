import net from 'node:net';
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import open from 'open';
import { startMarkyServer } from './start-server.js';

export type CliAction = 'run' | 'version' | 'help';

export interface ParsedCliArgs {
  action: CliAction;
  rootArg: string | null;
  port: number | null;
  openBrowser: boolean;
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  let action: CliAction = 'run';
  let rootArg: string | null = null;
  let port: number | null = null;
  let openBrowser = true;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--version' || token === '-v') {
      action = 'version';
      continue;
    }
    if (token === '--help' || token === '-h') {
      action = 'help';
      continue;
    }
    if (token === '--no-open') {
      openBrowser = false;
      continue;
    }
    if (token === '--port') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--port requires a value');
      }
      port = Number.parseInt(value, 10);
      if (Number.isNaN(port)) {
        throw new Error(`Invalid port: ${value}`);
      }
      index += 1;
      continue;
    }
    if (!token.startsWith('--') && rootArg === null) {
      rootArg = token;
    }
  }

  return {
    action,
    rootArg,
    port,
    openBrowser,
  };
}

export function readPackageVersion(moduleUrl: string): string {
  const here = path.dirname(fileURLToPath(moduleUrl));
  const pkgPath = path.resolve(here, '../../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string };
  return pkg.version ?? '0.0.0';
}

const HELP_TEXT = `marky — local-first markdown workspace

Usage:
  marky [path] [options]

Arguments:
  path              Root directory to serve (defaults to current directory)

Options:
  --port <number>   Port to listen on (default: 4310, auto-increments up to 4320)
  --no-open         Don't open the browser on start
  -v, --version     Print version and exit
  -h, --help        Show this help and exit
`;

export function resolveRootDir(input: {
  envRootDir: string | undefined;
  rootArg: string | null;
  cwd: string;
}): string {
  if (input.envRootDir && input.envRootDir.trim()) {
    return path.resolve(input.envRootDir);
  }
  if (input.rootArg) {
    return path.resolve(input.rootArg);
  }
  return path.resolve(input.cwd);
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

export async function resolvePort(input: {
  requestedPort: number | null;
  defaultPort: number;
  isPortAvailable?: (port: number) => Promise<boolean>;
}): Promise<number> {
  const checkPort = input.isPortAvailable ?? isPortAvailable;

  if (input.requestedPort !== null) {
    const available = await checkPort(input.requestedPort);
    if (!available) {
      throw new Error(`Port ${input.requestedPort} is already in use`);
    }
    return input.requestedPort;
  }

  for (let port = input.defaultPort; port <= 4320; port += 1) {
    if (await checkPort(port)) {
      return port;
    }
  }

  throw new Error(`No free port available in ${input.defaultPort}..4320`);
}

export async function maybeOpenBrowser(input: {
  url: string;
  openBrowser: boolean;
}): Promise<void> {
  if (!input.openBrowser) {
    return;
  }
  await open(input.url);
}

function resolveDefaultStaticDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../client/dist');
}

export function isDirectCliInvocation(input: {
  moduleUrl: string;
  argv1: string | undefined;
  realpath?: (filePath: string) => string;
}): boolean {
  if (!input.argv1) {
    return false;
  }

  const canonicalize = input.realpath ?? ((filePath: string) => realpathSync(filePath));

  try {
    const modulePath = canonicalize(fileURLToPath(input.moduleUrl));
    const argvPath = canonicalize(path.resolve(input.argv1));
    return modulePath === argvPath;
  } catch {
    return input.moduleUrl === pathToFileURL(path.resolve(input.argv1)).href;
  }
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseCliArgs(argv);

  if (parsed.action === 'version') {
    console.log(readPackageVersion(import.meta.url));
    return;
  }
  if (parsed.action === 'help') {
    console.log(HELP_TEXT);
    return;
  }

  const rootDir = resolveRootDir({
    envRootDir: process.env.ROOT_DIR,
    rootArg: parsed.rootArg,
    cwd: process.cwd(),
  });
  const port = await resolvePort({
    requestedPort: parsed.port,
    defaultPort: 4310,
  });
  const staticDir = resolveDefaultStaticDir();

  await startMarkyServer({
    rootDir,
    port,
    staticDir,
    logger: true,
  });

  const url = `http://127.0.0.1:${port}`;
  console.log(url);
  await maybeOpenBrowser({
    url,
    openBrowser: parsed.openBrowser,
  });
}

if (isDirectCliInvocation({ moduleUrl: import.meta.url, argv1: process.argv[1] })) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
