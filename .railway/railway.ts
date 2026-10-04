import { defineRailway, github, preserve, project, service } from "railway/iac";

// Replaces railway.json (Railway's Config as Code, deprecated after
// 2026-12-01). Applied with `railway config apply` from this repo - it is
// NOT picked up on git push. Review `railway config plan` first.
//
// This repo owns only the frontend service; the backend repo has its own
// partial for BookMania_Backend.
export const partial = "BookMania_Frontend";

export default defineRailway(() => {
  const BookMania_Frontend = service("BookMania_Frontend", {
    source: github("costanna/BookMania_Frontend"),
    build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    deploy: {
      numReplicas: 1,
      // Restart policy is left to Railway's default (ON_FAILURE, max 10
      // retries - same as the old railway.json). Railway stores the default
      // as unset, so declaring it here would show as a change on every plan.
      // Serverless: the service sleeps when idle.
      sleepApplication: true,
    },
    // Set in Railway; baked into the bundle at build time by Vite.
    env: {
      VITE_API_URL: preserve(),
    },
  });
  return project("BookMania", {
    resources: [BookMania_Frontend],
  });
});
