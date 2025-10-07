# Flippr

**A Simple and Fast Feature Flagging Service**

Flippr is a feature flagging service that helps developers release features safely. It lets you change your application's behavior in different environments (like production or staging) without deploying new code.

 

## Core Features

*   **Dynamic Configuration & Toggling:**  Instantly enable or disable features with a simple switch.
* **Multivariate Flags (Variants)**: Serve different string, number, or JSON values to your users for A/B testing, phased rollouts, and remote configuration.
*   **Multiple Environments:** Manage flags for `development`, `staging`, and `production` and more separately.
*   **Fast Evaluation:** A high-speed API for checking flag status with very low latency.
*   **Simple UI:** A web dashboard to manage all your projects, environments, and flags.

## Architecture

Flippr uses a **Control Plane / Data Plane** architecture to separate safe management from fast delivery.

*   **Control Plane (Management API)**
    *   **Purpose:** The UI and API used to create projects, configure environments, define flags
    *   **Technology:** Node.js, Express, Redis, PostgreSQL.
    *   **Characteristics:** Prioritizes data safety and consistency. It writes to the PostgreSQL database (the source of truth) and pushes the final, evaluated flag value to the Redis cache.

*   **Data Plane (Evaluation API)**
    *   **Purpose:** The API your applications call to check if a feature is enabled.
    *   **Technology:** Go, Redis.
    *   **Characteristics:** Prioritizes speed and high availability. It only reads the pre-calculated value from the Redis cache.

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

Use the **Management API** to change a flag's state for a specific environment.

```bash
curl --location --request PATCH 'http://localhost:4000/api/v1/flags/{flagId}/environments/{environmentId}' \
--header 'Content-Type: application/json' \
--data '{
    "isEnabled": true,
    "servingVariantId": "3333-variant-variant-..."
}'
```

### To Evaluate a Flag's Value

Use the **Evaluation API** from your application's SDK.

*Replace {sdkKey} with the key for your environment and {flagKey} with the key of your flag.*

```bash
curl --location --request GET 'http://localhost:8080/api/v1/evaluate/flags/{flagKey}' \
--header 'Authorization: {sdkKey}'
```

**Success Response:**

The API returns a JSON object with a single value key, which can hold a boolean, string, number, or object.

*For a boolean flag:*

```json
{
    "value": true
}
```

*For a string variant:*

```json
{
    "value": "Buy Now"
}
```
*For a JSON object variant:*

```json
{
    "value": {
        "fontSize": 16,
        "theme": "dark"
    }
}
```

*If the flag does not exist:*
```json
{
   "value": null
}
```

## SDK Example (JavaScript)

```javascript
import { FlipprClient } from 'flippr-sdk';

const flippr = new FlipprClient({ 
    sdkKey: 'prod_abc123...',
    baseUrl: 'http://localhost:8080'
});

// Example 1: Getting a string variant for an A/B test
async function getButtonText() {
  const buttonText = await flippr.getVariant<string>('new-checkout-button', 'Default Text');
  // buttonText will be "Buy Now!" or "Proceed to Payment", etc.
  document.getElementById('checkout-btn').innerText = buttonText;
}

// Example 2: Getting a number for remote configuration
async function getApiRateLimit() {
  const limit = await flippr.getVariant<number>('api-rate-limit', 100);
  // Configure an API client with the remotely-configured limit
}

// Example 3 Getting a JSON object for complex configuration
interface UiConfig {
  showAlerts: boolean;
  theme: 'light' | 'dark';
}
async function applyUiConfig() {
  const defaultConfig: UiConfig = { showAlerts: false, theme: 'light' };
  const config = await flippr.getVariant<UiConfig>('ui-config', defaultConfig);
  
  if (config.showAlerts) {
    // ...
  }
}
```
