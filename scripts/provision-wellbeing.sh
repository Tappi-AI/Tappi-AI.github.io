#!/usr/bin/env bash
# Provision a user's Tappi wellbeing storage on LatticeCast.
#
# Assumes the user ALREADY EXISTS. For each user given, this logs in as them
# (password login returns their user_id as the access token), then makes sure
# they own a "tappi" workspace containing a "wellbeing" table with the columns
# both Tappi frontends expect.
#
# Idempotent — safe to re-run; existing workspaces/tables/columns are reused.
#
# Usage:
#   ./scripts/provision-wellbeing.sh lattice
#   ./scripts/provision-wellbeing.sh alice bob carol
#   BACKEND=http://localhost:13491 ./scripts/provision-wellbeing.sh lattice
#
# Env:
#   BACKEND    backend base URL (default https://table.novasplit.ai)
#   PASSWORD   password used for login (default empty — AUTH_REQUIRED=false mode)

set -euo pipefail

BACKEND="${BACKEND:-https://table.novasplit.ai}"
PASSWORD="${PASSWORD:-}"
WORKSPACE_NAME="tappi"
TABLE_ID="wellbeing"

if [[ $# -lt 1 ]]; then
	echo "usage: $0 <user_name> [user_name...]" >&2
	exit 64
fi

command -v jq >/dev/null 2>&1 || { echo "error: jq is required" >&2; exit 69; }

# Columns Tappi needs on top of the blank-table defaults (Title/Doc/Description).
# name<TAB>type<TAB>options-json
read -r -d '' NEEDED_COLUMNS <<'EOF' || true
Time	text	{}
Mood	select	{"choices":[{"color":"#4ade80","value":"😊 happy"},{"color":"#ef4444","value":"😠 angry"},{"color":"#60a5fa","value":"😢 sad"},{"color":"#a7f3d0","value":"😌 calm"},{"color":"#fbbf24","value":"😰 anxious"},{"color":"#9ca3af","value":"😴 tired"},{"color":"#c084fc","value":"🤩 excited"}]}
Energy	number	{}
Memo	text	{}
Feeling	text	{}
EOF

api() {
	# api <method> <path> [json-body]
	local method="$1" path="$2" body="${3:-}"
	local args=(-sS -X "$method" "${BACKEND}${path}"
		-H "Authorization: Bearer ${TOKEN}"
		-w '\n%{http_code}')
	if [[ -n "$body" ]]; then
		args+=(-H 'Content-Type: application/json' -d "$body")
	fi
	curl "${args[@]}"
}

# Split the api() output into $RESP_BODY / $RESP_CODE.
call() {
	local raw; raw="$(api "$@")"
	RESP_CODE="${raw##*$'\n'}"
	RESP_BODY="${raw%$'\n'*}"
}

die() { echo "  ✗ $*" >&2; exit 1; }

provision_user() {
	local user_name="$1"
	echo "→ ${user_name}"

	# 1. Log in (user must already exist).
	local login_raw login_code login_body
	login_raw="$(curl -sS -X POST "${BACKEND}/api/v1/login/password" \
		-H 'Content-Type: application/json' \
		-d "$(jq -nc --arg u "$user_name" --arg p "$PASSWORD" '{user_name:$u,password:$p}')" \
		-w '\n%{http_code}')"
	login_code="${login_raw##*$'\n'}"
	login_body="${login_raw%$'\n'*}"

	if [[ "$login_code" == "404" ]]; then
		die "user '${user_name}' is not registered — create it first"
	fi
	[[ "$login_code" == "200" ]] || die "login failed (HTTP ${login_code}): ${login_body}"

	TOKEN="$(jq -r '.access_token' <<<"$login_body")"
	[[ -n "$TOKEN" && "$TOKEN" != "null" ]] || die "login returned no access_token"
	echo "  ✓ logged in (user_id ${TOKEN})"

	# 2. Workspace "tappi" — reuse if the user already owns one.
	call GET /api/v1/workspaces
	[[ "$RESP_CODE" == "200" ]] || die "list workspaces failed (HTTP ${RESP_CODE}): ${RESP_BODY}"

	local ws_id
	ws_id="$(jq -r --arg n "$WORKSPACE_NAME" \
		'[.[] | select(.workspace_name == $n)][0].workspace_id // empty' <<<"$RESP_BODY")"

	if [[ -n "$ws_id" ]]; then
		echo "  = workspace '${WORKSPACE_NAME}' exists (${ws_id})"
	else
		call POST /api/v1/workspaces "$(jq -nc --arg n "$WORKSPACE_NAME" '{workspace_name:$n}')"
		[[ "$RESP_CODE" == "201" ]] || die "create workspace failed (HTTP ${RESP_CODE}): ${RESP_BODY}"
		ws_id="$(jq -r '.workspace_id' <<<"$RESP_BODY")"
		echo "  + workspace '${WORKSPACE_NAME}' created (${ws_id})"
	fi

	# 3. Table "wellbeing" inside that workspace.
	call GET /api/v1/tables
	[[ "$RESP_CODE" == "200" ]] || die "list tables failed (HTTP ${RESP_CODE}): ${RESP_BODY}"

	local has_table
	has_table="$(jq -r --arg t "$TABLE_ID" --arg w "$ws_id" \
		'[.[] | select(.table_id == $t and (.workspace_id | tostring) == $w)] | length' <<<"$RESP_BODY")"

	if [[ "${has_table:-0}" -gt 0 ]]; then
		echo "  = table '${TABLE_ID}' exists"
	else
		call POST /api/v1/tables "$(jq -nc --arg t "$TABLE_ID" --arg w "$ws_id" '{table_id:$t,workspace_id:$w}')"
		[[ "$RESP_CODE" == "201" ]] || die "create table failed (HTTP ${RESP_CODE}): ${RESP_BODY}"
		echo "  + table '${TABLE_ID}' created"
	fi

	# 4. Columns — add only the ones missing.
	call GET "/api/v1/tables/${TABLE_ID}?workspace_id=${ws_id}"
	[[ "$RESP_CODE" == "200" ]] || die "read table failed (HTTP ${RESP_CODE}): ${RESP_BODY}"
	local existing; existing="$RESP_BODY"

	while IFS=$'\t' read -r col_name col_type col_opts; do
		[[ -z "$col_name" ]] && continue
		if jq -e --arg n "$col_name" '.columns[]? | select(.name == $n)' >/dev/null <<<"$existing"; then
			echo "  = column ${col_name}"
			continue
		fi
		call POST "/api/v1/tables/${TABLE_ID}/columns" \
			"$(jq -nc --arg n "$col_name" --arg t "$col_type" --argjson o "$col_opts" \
				'{name:$n,type:$t,options:$o}')"
		[[ "$RESP_CODE" == "201" ]] || die "create column ${col_name} failed (HTTP ${RESP_CODE}): ${RESP_BODY}"
		existing="$RESP_BODY"   # mutation returns the full refreshed schema
		echo "  + column ${col_name}"
	done <<<"$NEEDED_COLUMNS"

	# 5. Report the resolved schema.
	call GET "/api/v1/tables/${TABLE_ID}?workspace_id=${ws_id}"
	echo "  ── ${WORKSPACE_NAME}/${TABLE_ID} columns:"
	jq -r '.columns[] | "     \(.name)\t\(.type)\t\(.column_id)"' <<<"$RESP_BODY"
}

for u in "$@"; do
	provision_user "$u"
done

echo "done."
