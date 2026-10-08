import "server-only";

// App and Proxy imports are restricted to the server. The pure validator is
// also used while Next.js loads its configuration, before it can serve requests.
export { getAuthConfig, isTrustedOrigin, type AuthConfig } from "./auth-env";
