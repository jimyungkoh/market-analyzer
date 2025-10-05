import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";

type RuntimeOption = "docker" | "python";

type SpawnPythonOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

type DockerComposeInvocation = {
  command: string;
  args: string[];
};

let cachedDockerInvocation: DockerComposeInvocation | null | undefined;

const toRuntime = (value: string | undefined): RuntimeOption => {
  if (value && value.toLowerCase() === "python") {
    return "python";
  }
  return "docker";
};

const detectDockerCompose = (): DockerComposeInvocation | null => {
  if (cachedDockerInvocation !== undefined) {
    return cachedDockerInvocation;
  }

  const plugin = spawnSync("docker", ["compose", "version"], {
    stdio: "ignore",
  });

  if (plugin.status === 0) {
    cachedDockerInvocation = { command: "docker", args: ["compose"] };
    return cachedDockerInvocation;
  }

  const legacy = spawnSync("docker-compose", ["version"], {
    stdio: "ignore",
  });

  if (legacy.status === 0) {
    cachedDockerInvocation = { command: "docker-compose", args: [] };
    return cachedDockerInvocation;
  }

  cachedDockerInvocation = null;
  return cachedDockerInvocation;
};

const resolveRuntime = (): RuntimeOption => {
  const preferred = toRuntime(process.env.SCRIPTS_RUNTIME);

  if (preferred === "docker") {
    const dockerInvocation = detectDockerCompose();
    if (dockerInvocation) {
      return "docker";
    }
    console.warn(
      "[runPythonScript] docker compose not detected; falling back to host Python runtime."
    );
  }

  return "python";
};

const resolveComposeFilePath = (cwd: string): string | null => {
  const composeFile = process.env.SCRIPTS_DOCKER_COMPOSE_FILE ?? "docker-compose.dev.yml";
  const candidate = isAbsolute(composeFile) ? composeFile : join(cwd, composeFile);

  if (existsSync(candidate)) {
    return candidate;
  }

  console.warn(
    `[runPythonScript] compose file not found at ${candidate}; falling back to host Python.`
  );
  return null;
};

export function spawnPythonScript(
  scriptName: string,
  args: string[],
  options: SpawnPythonOptions = {}
): ChildProcess {
  const runtime = resolveRuntime();
  const cwd = options.cwd ?? process.cwd();
  const env = { ...process.env, ...options.env };

  if (runtime === "python") {
    return spawn(
      "python3",
      [
        `scripts/${scriptName}`,
        ...args,
      ],
      {
        cwd,
        env,
      }
    );
  }

  const composeFilePath = resolveComposeFilePath(cwd);

  if (!composeFilePath) {
    return spawn(
      "python3",
      [
        `scripts/${scriptName}`,
        ...args,
      ],
      {
        cwd,
        env,
      }
    );
  }

  const dockerInvocation = detectDockerCompose();

  if (!dockerInvocation) {
    throw new Error("docker compose is unavailable.");
  }

  // Default: keep Python dependencies isolated inside the scripts service.
  return spawn(
    dockerInvocation.command,
    [
      ...dockerInvocation.args,
      "-f",
      composeFilePath,
      "exec",
      "scripts",
      "python",
      scriptName,
      ...args,
    ],
    {
      cwd,
      env,
    }
  );
}
