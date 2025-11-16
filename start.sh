#!/bin/sh
set -e

PORT="${PORT:-8080}"
export PORT

echo "Starting PHP built-in server on 0.0.0.0:${PORT}..."
exec php -S 0.0.0.0:"${PORT}" -t public public/router.php
