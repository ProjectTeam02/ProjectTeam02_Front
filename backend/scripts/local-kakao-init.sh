#!/usr/bin/env bash
# 전용 로컬 DB에 필요한 역할만 난수 비밀번호로 만듭니다. 실제 값은 로그에 출력하지 않습니다.
set -Eeuo pipefail
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_MIGRATION_PASSWORD:?DB_MIGRATION_PASSWORD is required}"
: "${DB_AI_PASSWORD:?DB_AI_PASSWORD is required}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v app_password="$DB_PASSWORD" -v migrator_password="$DB_MIGRATION_PASSWORD" \
  -v ai_password="$DB_AI_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE app_user LOGIN PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') \gexec
SELECT format('CREATE ROLE migrator LOGIN PASSWORD %L', :'migrator_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'migrator') \gexec
SELECT format('CREATE ROLE ai_user LOGIN PASSWORD %L', :'ai_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_user') \gexec
SQL
