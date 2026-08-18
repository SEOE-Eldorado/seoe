import { NextRequest, NextResponse } from "next/server";

/**
 * ⚠️ DEPRECATED ENDPOINT — DO NOT USE
 *
 * This endpoint was a security hole: any authenticated user could POST
 * `{ amount: 1e9 }` and credit their own balance without paying anything.
 *
 * The only valid path to credit user balance is the Macro Click webhook
 * (`/api/webhook/macro-click`) which fires AFTER Macro Click confirms
 * the payment succeeded.
 *
 * See: .hermes/plans/2026-08-18-auditoria-seoe.md (issue #2)
 */
export async function POST(_request: NextRequest) {
    return NextResponse.json(
        {
            error: "Este endpoint está deshabilitado. Para cargar saldo, usá el flujo de pago de Macro Click.",
            code: "ENDPOINT_DISABLED",
        },
        { status: 403 }
    );
}
