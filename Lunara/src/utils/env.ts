/**
 * Get environment variable value safely across different environments
 * (Node.js, Jest test runtime, and Vite when process.env is polyfilled).
 *
 * Uses only process.env so that Jest can parse this file (import.meta is not
 * available in Jest's Node environment). For Vite builds, ensure process.env
 * is set from import.meta.env in app entry if needed.
 */
export function getEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process?.env?.[key] !== undefined) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Get Cloudinary cloud name from environment
 */
export function getCloudinaryCloudName(): string {
  return getEnvVar('VITE_CLOUDINARY_CLOUD_NAME') ?? 'your-cloud-name';
}
