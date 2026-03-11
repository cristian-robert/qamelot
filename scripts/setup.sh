#!/usr/bin/env bash
set -e

echo "🏰 Setting up Qamelot development environment..."

# 1. Check for Homebrew
if ! command -v brew &>/dev/null; then
  echo "❌ Homebrew not found. Install from https://brew.sh first."
  exit 1
fi

# 2. Install and start PostgreSQL
echo "📦 Installing PostgreSQL 16..."
brew install postgresql@16 2>/dev/null || true
brew services start postgresql@16
sleep 2  # Give postgres a moment to start
echo "✅ PostgreSQL started"

# 3. Create database (idempotent)
echo "🗄️  Creating database testtrack_dev..."
createdb testtrack_dev 2>/dev/null || echo "   Database already exists, skipping."

# 4. Copy env files if not present
if [ ! -f apps/backend/.env ]; then
  cp .env.example apps/backend/.env
  sed -i '' "s/YOUR_MAC_USERNAME/$(whoami)/" apps/backend/.env
  echo "📝 Created apps/backend/.env"
fi
if [ ! -f apps/frontend/.env.local ]; then
  cp apps/frontend/.env.example apps/frontend/.env.local
  echo "📝 Created apps/frontend/.env.local"
fi

# 5. Install dependencies
echo "📦 Installing pnpm dependencies..."
pnpm install

# 6. Build shared package
echo "🔨 Building @app/shared..."
pnpm --filter @app/shared build

# 7. Run Prisma migrations
# Note: uses 'migrate deploy' (applies existing SQL files).
# On a FRESH clone with no migration files yet, run:
#   cd apps/backend && pnpm exec prisma migrate dev --name init && cd ../..
echo "🗄️  Applying database migrations..."
pnpm --filter backend exec prisma migrate deploy

echo ""
echo "✅ Qamelot is ready! Run: pnpm dev"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   API docs: http://localhost:3001/api/docs"
