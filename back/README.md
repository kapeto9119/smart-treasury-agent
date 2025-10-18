# Smart Treasury Agent - Backend API

Express + TypeScript backend for treasury management and simulation orchestration.

## Structure

```
/back
  /src
    /config
      env.ts                 - Environment configuration
    /controllers
      accountsController.ts  - Account management
      forecastController.ts  - Cash flow forecasts
      policyController.ts    - Treasury policies
      scenariosController.ts - Simulation orchestration
      transfersController.ts - Cash transfers
      evalController.ts      - Evaluation logging
      marketDataController.ts - FX rates & market data
    /middleware
      auth.ts                - WorkOS authentication
      errorHandler.ts        - Error handling
    /routes
      index.ts               - Route definitions
    /services
      supabaseService.ts     - Database operations
      claudeService.ts       - AI recommendations
      daytonaService.ts      - Sandbox orchestration
      browserUseService.ts   - Web scraping
    /types
      index.ts               - TypeScript definitions
    /scripts
      seedData.ts            - Database seeding
    server.ts                - Express app entry point
  package.json
  tsconfig.json
```

## API Reference

See main README for endpoint documentation.

## Development

```bash
npm install
npm run dev
```

## Seeding Database

```bash
npx tsx src/scripts/seedData.ts
```

## Building for Production

```bash
npm run build
npm start
```

