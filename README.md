# Smart Incubator Frontend

A Next.js 14 application for managing Smart Incubator IoT devices.

## Features

- **Authentication**: JWT-based login with the FastAPI backend.
- **Real-time Dashboard**: Live telemetry updates via WebSockets.
- **Device Management**: View device status, historical data (charts), and send remote commands.
- **Firmware Management**: Upload and view firmware versions.
- **Responsive Design**: Built with TailwindCSS and Shadcn/UI (mobile friendly).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS, Shadcn/UI, Lucide React
- **State/Fetching**: TanStack React Query, Axios
- **Charts**: Recharts
- **Forms**: React Hook Form, Zod

## Getting Started

### Prerequisites

- Node.js 18+
- Backend running on `http://localhost:8000` (API) and `ws://localhost:8000` (WebSocket)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components.
- `src/hooks`: Custom hooks (useAuth, useWebSocket).
- `src/lib`: Utilities (Axios setup, cn helper).

## Key Pages

- `/login`: Admin login.
- `/farms`: List of incubator farms.
- `/farms/[id]/dashboard`: Real-time view of devices in a farm.
- `/devices/[id]`: Detailed telemetry charts and control panel.
- `/firmware`: OTA firmware upload.
