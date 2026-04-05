export { PERMISSION_GROUPS, type PermissionDef, type PermissionGroup, type Tier } from "./permissionGroups";
export { ROLE_PRESETS, ROLE_LABELS, type PresetCell } from "./rolePresets";

import { PERMISSION_GROUPS } from "./permissionGroups";

const nameByKey = new Map<string, string>();
for (const g of PERMISSION_GROUPS) {
  for (const p of g.permissions) {
    nameByKey.set(p.key, p.name);
  }
}

export function getPermissionDisplayName(key: string): string {
  return nameByKey.get(key) ?? key;
}
