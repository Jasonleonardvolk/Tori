/**
 * Schema Versions
 * 
 * Defines schema versions for WebSocket protocol to ensure compatibility
 * between client and server.
 * 
 * Increment MAJOR version for breaking changes (require client update)
 * Increment MINOR version for backwards-compatible changes
 */

export interface SchemaVersion {
  major: number;  // Major version (incompatible changes)
  minor: number;  // Minor version (compatible changes)
  build: string;  // Build hash or identifier
}

// Declare global variables for TypeScript
declare global {
  interface Window {
    __BUILD_HASH__?: string;
  }
  
  namespace NodeJS {
    interface Global {
      __BUILD_HASH__?: string;
    }
  }
}

// Get build hash from environment or global variable
const getBuildHash = (): string => {
  // Try to get from window.__BUILD_HASH__ (browser)
  if (typeof window !== 'undefined' && window.__BUILD_HASH__) {
    return window.__BUILD_HASH__;
  }
  
  // Try to get from environment variables via a global BUILD_HASH
  if (typeof globalThis !== 'undefined' && (globalThis as any).__BUILD_HASH__) {
    return (globalThis as any).__BUILD_HASH__;
  }
  
  // Default value
  return 'dev';
};

// Current schema version
export const CURRENT_SCHEMA_VERSION: SchemaVersion = {
  major: 1,
  minor: 0,
  build: getBuildHash(),
};

/**
 * WebSocket handshake packet structure
 */
export interface HandshakePacket {
  type: 'hello';
  version: SchemaVersion;
  capabilities?: string[];  // Optional array of supported capabilities
  clientId?: string;        // Optional client identifier
}

/**
 * WebSocket handshake response structure
 */
export interface HandshakeResponse {
  type: 'welcome' | 'version_mismatch';
  serverVersion: SchemaVersion;
  compatible: boolean;      // Whether the client version is compatible
  minVersion?: SchemaVersion; // Minimum supported version if incompatible
  message?: string;         // Optional message with compatibility information
}

/**
 * Check if client version is compatible with server
 * 
 * @param clientVersion Client schema version
 * @returns Whether the versions are compatible
 */
export function isCompatibleVersion(clientVersion: SchemaVersion): boolean {
  // Major version must match exactly
  if (clientVersion.major !== CURRENT_SCHEMA_VERSION.major) {
    return false;
  }
  
  // Client minor version should be <= server minor version
  if (clientVersion.minor > CURRENT_SCHEMA_VERSION.minor) {
    return false;
  }
  
  return true;
}

/**
 * Generate handshake response for a client hello packet
 * 
 * @param hello Client hello packet
 * @returns Handshake response
 */
export function generateHandshakeResponse(hello: HandshakePacket): HandshakeResponse {
  const clientVersion = hello.version || { major: 0, minor: 0, build: 'unknown' };
  const compatible = isCompatibleVersion(clientVersion);
  
  if (compatible) {
    return {
      type: 'welcome',
      serverVersion: CURRENT_SCHEMA_VERSION,
      compatible: true,
    };
  } else {
    return {
      type: 'version_mismatch',
      serverVersion: CURRENT_SCHEMA_VERSION,
      compatible: false,
      minVersion: { major: CURRENT_SCHEMA_VERSION.major, minor: 0, build: 'min' },
      message: `Client version ${clientVersion.major}.${clientVersion.minor} is not compatible with server version ${CURRENT_SCHEMA_VERSION.major}.${CURRENT_SCHEMA_VERSION.minor}. Please update your client.`
    };
  }
}
