import { NextResponse } from "next/server";

import {
  getMenuPermissionAccess,
  type MenuAccessSuccess,
} from "@/lib/menu-access";

type RouteAccessResult =
  | { ok: true; access: MenuAccessSuccess }
  | { ok: false; response: NextResponse };

export async function requireMenuAccess(
  permission: string,
): Promise<RouteAccessResult> {
  const access = await getMenuPermissionAccess(permission);

  if (!access.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: access.error },
        { status: access.status },
      ),
    };
  }

  return {
    ok: true,
    access,
  };
}
