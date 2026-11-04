export default async function globalTeardown() {
  await globalThis.__POSTGRES_CONTAINER__?.stop();
}
