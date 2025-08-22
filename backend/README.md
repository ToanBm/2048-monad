# Monad Game Backend

Backend API server for Monad Game, runs independently on VPS.

## Structure

```
backend/
├── src/
│   ├── routes/          # API routes
│   │   ├── player.ts    # Player API endpoints
│   │   └── privy.ts     # Privy config endpoints
│   ├── lib/             # Blockchain logic
│   │   ├── blockchain.ts
│   │   └── contract-abi.ts
│   └── app.ts           # Express.js server
├── logs/                 # Log files
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── ecosystem.config.js   # PM2 config
└── env.example          # Environment variables template
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create .env file
```bash
cp env.example .env
# Edit values in .env
```

### 3. Build project
```bash
npm run build
```

### 4. Run server
```bash
# Development
npm run dev

# Production
npm start

# Or use PM2
pm2 start ecosystem.config.js
```

## API Endpoints

- `POST /api/update-player-data` - Update score and transaction
- `GET /api/get-player-data` - Get player information
- `GET /api/get-player-data-per-game` - Get player information by game
- `GET /api/get-privy-config` - Get Privy configuration
- `GET /health` - Health check

## Environment Variables

- `NODE_ENV` - Environment (production/development)
- `PORT` - Port for server (default: 3001)
- `WALLET_PRIVATE_KEY` - Private key of wallet with GAME_ROLE
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy App ID
- `FRONTEND_URL` - Frontend URL (for CORS)

## Deploy to VPS

1. Copy entire `backend/` directory to VPS
2. Install Node.js and PM2
3. Create `.env` file with actual values
4. Run `npm install && npm run build`
5. Run `pm2 start ecosystem.config.js`
