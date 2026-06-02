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
};

export default createJestConfig(config);
