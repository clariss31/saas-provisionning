import nextJest from "next/jest.js";

/**
 * Configuration Jest pour le projet Next.js.
 *
 * `next/jest` câble automatiquement la transformation SWC (TS/JSX), la prise en
 * charge des imports CSS/images et le chargement de `next.config`. On y ajoute
 * l'environnement jsdom (DOM simulé), le fichier de setup (matchers
 * jest-dom) et le mapping de l'alias d'import `@/`.
 */
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Exécution sérielle (un seul worker) : la suite est petite (~7 s) et cela
  // évite les crashes intermittents de workers parallèles observés sous Windows
  // (« Jest worker encountered child process exceptions »).
  maxWorkers: 1,
};

export default createJestConfig(config);
