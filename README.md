# Flippr

**A Simple and Fast Feature Flagging Service**

Flippr is a feature flagging service that helps developers release features safely. It lets you turn features on or off in different environments (like `production` or `staging`) without deploying new code.

 

## Core Features

*   **Turn Features On/Off:** Instantly enable or disable features.
*   **Multiple Environments:** Manage flags for `development`, `staging`, and `production` separately.
*   **Fast Evaluation:** A high-speed API for checking flag status with very low latency.
*   **Simple UI:** A web dashboard to manage all your flags.

## Architecture

Flippr uses a **Control Plane / Data Plane** architecture to separate safe management from fast delivery.

*   **Control Plane (Management API)**
    *   **Purpose:** The UI and API used to create and change flags.
    *   **Technology:** Node.js, Express, Redis, PostgreSQL.
    *   **Characteristics:** Prioritizes data safety and consistency. It writes to both the PostgreSQL database (the source of truth) and the Redis cache.

*   **Data Plane (Evaluation API)**
    *   **Purpose:** The API your applications call to check if a feature is enabled.
    *   **Technology:** Go, Redis.
    *   **Characteristics:** Prioritizes speed and high availability. It only reads from the Redis cache.

## Tech Stack

*   **Backend (Control Plane):** Node.js, Express, TypeScript
*   **Backend (Data Plane):** Go
*   **Frontend:** React
*   **Database:** PostgreSQL, Redis
*   **Containerization:** Docker

## Running Locally

You will need Docker installed locally.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/flippr.git
    cd flippr
    ```

2.  **Set up environment variables:**
    Each service needs its own `.env` file. Copy the example files:
    ```bash
    cp services/management-api/.env.example services/management-api/.env
    cp services/evaluation-api/.env.example services/evaluation-api/.env
    ```

3.  **Run with Docker Compose:**
    ```bash
    docker-compose up --build
    ```

4.  **Access the services:**
    *   **Management UI:** `http://localhost`
    *   **Management API (Node.js):** `http://localhost:4000`
    *   **Evaluation API (Go):** `http://localhost:8080`

## API Usage Examples

### To Change a Flag's State

Use the **Management API** to turn a flag on or off for a specific environment.

```bash
curl --location --request PATCH 'http://localhost:4000/api/v1/environments/{envId}/flags/{flagKey}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "isEnabled": true
}'
```

### To Check if a Flag is Enabled

Use the **Evaluation API** from your application.

*Replace `{sdkKey}` with the key for your environment (e.g., `prod_abc123...`).*

```bash
curl --location --request GET 'http://localhost:8081/evaluate/flags/{flagKey}' \
--header 'Authorization: Bearer {sdkKey}'
```

**Success Response:**
```json
{
    "enabled": true
}
```

## SDK Example (JavaScript)

```javascript
import { FlipprClient } from 'flippr-sdk';

const flippr = new FlipprClient({ 
    sdkKey: 'prod_abc123...'
});

async function renderCheckoutPage() {
  if (await flippr.isEnabled('new-checkout-flow')) {
    // Show the new checkout page
  } else {
    // Show the old, existing checkout page
  }
}
```
