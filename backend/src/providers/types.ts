/**
 * Provider-agnostic remote types. Provider implementations return these
 * normalized shapes; consumers (alias service, sync) treat IDs as opaque
 * strings without knowing the underlying provider's identifier format.
 */

export interface RemoteRedirection {
  /** Opaque provider-specific ID. Use as-is for CRUD; do not interpret. */
  id: string;
  from: string;
  to: string;
}
