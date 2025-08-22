# Monad Game - Setup Guide

The project has been split into 2 separate parts:
- **Frontend**: Next.js app (deployed on Vercel)
- **Backend**: Express.js server (runs on VPS)

## Project Structure

```
mission7-example-game/
├── app/                    # Frontend Next.js (deploy Vercel)
│   ├── components/         # React components
│   ├── lib/               # Frontend utilities
│   │   ├── api-config.ts  # API configuration
│   │   └── score-api.ts   # API client (updated)
│   └── ...
├── backend/                # Backend Express.js (runs VPS)
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── lib/           # Blockchain logic
│   │   └── app.ts         # Express server
│   ├── package.json       # Backend dependencies
│   ├── tsconfig.json      # TypeScript config
│   └── ecosystem.config.js # PM2 config
├── shared/                 # Shared code (types, utils)
└── package.json            # Frontend dependencies
```

## Setup Backend (VPS)

### 1. Copy backend to VPS
```bash
# Copy entire backend/ directory to VPS
scp -r backend/ user@vps-ip:/home/monadgame/
```

### 2. Install dependencies
```bash
cd /home/monadgame/backend
npm install
```

### 3. Create .env file
```bash
cp env.example .env
# Edit values in .env
```

### 4. Build and run
```bash
npm run build
pm2 start ecosystem.config.js
```

## Setup Frontend (Vercel)

### 1. Update environment variables
On Vercel Dashboard, add:
```env
NEXT_PUBLIC_API_BASE_URL=http://your-vps-ip:3001
```

### 2. Deploy
Frontend will automatically deploy when code is pushed to Git.

## API Endpoints

Backend provides these API endpoints:

- `POST /api/update-player-data` - Update score and transaction
- `GET /api/get-player-data` - Get player information
- `GET /api/get-player-data-per-game` - Get player information by game
- `GET /api/get-privy-config` - Get Privy configuration
- `GET /health` - Health check

## Workflow

```
Frontend (Vercel) → API Call → Backend (VPS) → Blockchain (Monad)
```

## Development

### Local Backend
```bash
cd backend
npm run dev
```

### Local Frontend
```bash
npm run dev
```

## Production

### Backend on VPS
```bash
cd backend
pm2 start ecosystem.config.js
```

### Frontend on Vercel
Automatically deploy from Git.

## Troubleshooting

### Backend not running
- Check if port 3001 is open
- Check if .env file is correct
- Check PM2 logs: `pm2 logs monad-game-backend`

### Frontend can't call API
- Check CORS configuration
- Check if VPS IP is correct
- Check if backend is running

### Blockchain errors
- Check if private key is correct
- Check if wallet has GAME_ROLE
- Check if there are enough MON tokens
