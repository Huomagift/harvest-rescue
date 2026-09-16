# Harvest Rescue

> **Know the risk before you lose the harvest.**

Harvest Rescue is an agricultural early-warning and crop-loss risk intelligence platform designed to help farmers understand emerging risks to their farms before those risks become significant crop losses.

The platform combines weather and satellite-derived vegetation data to assess farm conditions, explain the factors contributing to risk, and provide practical actions farmers can take.

---

## Overview

Farmers often have limited access to timely and understandable information about changing environmental conditions that can affect their crops.

Harvest Rescue turns environmental and satellite observations into a simple flow:

**Risk → Explanation → Action**

Instead of presenting raw agricultural data, Harvest Rescue focuses on helping farmers answer three questions:

* **What is happening on my farm?**
* **Why is it happening?**
* **What should I do about it?**

---

## How It Works

A farmer registers a farm using basic information:

* Farm name
* Farm location
* Crop type
* Planting date

Harvest Rescue then evaluates available environmental data and generates an explainable risk assessment for the farm.

### MVP Risk Engine

The MVP uses a **rules-based composite risk index**, rather than a trained machine-learning model.

The risk assessment combines multiple environmental signals to identify potential threats to crop health.

### Core Risk Signals

#### 🌧️ Flood Risk

Flood risk is assessed using indicators such as:

* Rainfall anomalies
* Excessive rainfall

#### ☀️ Heat & Drought Risk

Heat and drought risk considers conditions such as:

* Sustained high temperatures
* Low rainfall

#### 🌱 Crop Vigor Decline

Crop health trends are assessed using satellite-derived vegetation information, including:

* NDVI (Normalized Difference Vegetation Index)
* Negative NDVI trends

---

## Risk Assessment

Each identified risk is presented in an understandable format, including:

* **Risk severity**
* **Overall risk score**
* **Contributing factors**
* **Expected timing or days-to-impact**, where available
* **Recommended actions**

The goal is to help farmers understand what the data means without requiring them to interpret raw weather or satellite information.

---

## Risk → Explanation → Action

Harvest Rescue follows a simple information hierarchy throughout the product.

### 1. Risk

Identify the environmental condition that may threaten the farm.

### 2. Explanation

Show the factors contributing to the risk and explain relevant agricultural concepts.

### 3. Action

Provide practical guidance on what the farmer can do next.

This keeps complex environmental information focused on decisions a farmer can actually understand and act upon.

---

## Swift Agents

**SwiftAgents** is Harvest Rescue's embedded customer-representative agent.

SwiftAgents is designed as an **embeddable SDK/widget**, rather than a separate application or dashboard.

It can be integrated directly into the Harvest Rescue interface to help farmers:

* Understand why their farm is at risk
* Explain agricultural terms such as NDVI
* Understand the current risk assessment
* Get guidance on what to do next
* Request a mocked handoff to an agronomist or human representative

### Contextual Assistance

SwiftAgents is contextual to the page the farmer is currently viewing.

Where available, it can use the farm's current risk information when responding to questions.

SwifAgents should **not invent information** when relevant farm or environmental data is unavailable.

---

## MVP Scope

The current MVP focuses on:

* Single-farm registration
* Farm-level risk assessment
* Weather-based risk signals
* Satellite-derived vegetation indicators
* Explainable risk scoring
* Risk severity classification
* Risk explanations
* Recommended actions
* Contextual Swift Agent support
* Data availability and error handling

### Out of Scope for the MVP

The MVP does **not** depend on a trained machine-learning model.

The following capabilities are future directions rather than currently available functionality:

* Advanced machine-learning prediction
* IoT and farm sensor integration
* Insurance integrations
* Financial services integrations
* Multi-farm intelligence
* Real agronomist escalation
* Additional communication channels

---

## Product States

Harvest Rescue is designed to account for real-world application states, including:

### Farm States

* No farm registered
* Farm analysis in progress
* Analysis completed
* Invalid farm location

### Risk States

* No active risk
* Low risk
* Medium risk
* High risk
* Multiple active risks

### Data States

* Fresh data
* Stale data
* Weather data unavailable
* Satellite data unavailable
* Partial data availability

These states are treated as part of the product experience rather than edge cases to be handled later.

---

## Design Philosophy

Harvest Rescue is designed as a **real, production-oriented agricultural application**, rather than a conceptual AI dashboard.

The interface follows **Material 3 design principles**, with emphasis on:

* Clear information hierarchy
* Intentional component usage
* Accessible interactions
* Responsive layouts
* Meaningful cards and surfaces
* Clear feedback states
* Practical information density
* Consistent typography and spacing
* Complete loading, empty, error, and disabled states

AI should support the product experience rather than dominate the visual design.

The interface prioritizes useful agricultural information, clear explanations, and actionable guidance over unnecessary visual complexity.

---

## Architecture

At a high level, Harvest Rescue consists of:

```text
Farmer
   │
   ▼
Harvest Rescue Web Application
   │
   ├── Farm Registration
   │
   ├── Farm Analysis
   │      ├── Weather Data
   │      └── Satellite / NDVI Data
   │
   ├── Risk Engine
   │      └── Rules-based Composite Risk Index
   │
   ├── Risk Dashboard
   │
   └── Swift Agent
          └── Embedded Customer Representative
```

---

## Core Value

Harvest Rescue is built around a simple idea:

> **Farmers should know about potential crop-loss risks early enough to understand them and act on them.**

By combining environmental observations with explainable risk assessment and actionable guidance, Harvest Rescue aims to turn complex agricultural data into information farmers can actually use.

---

## Future Direction

Potential future capabilities include:

* More advanced crop intelligence
* IoT and farm sensor integration
* Broader environmental data sources
* Machine-learning-based prediction
* Insurance and financial services integrations
* Cooperative and multi-farm intelligence
* Additional communication channels
* Real agronomist escalation
* Expanded crop and regional intelligence

These capabilities are **not part of the current MVP** and should not be represented as currently available functionality.

---

## Getting Started

### Frontend

### Prerequisites

Before running the project locally, make sure you have:

* Node.js
* npm, pnpm, or yarn
* Git

### Installation

```bash
git clone <repository-url>
cd harvest-rescue
npm install
```

### Development

```bash
npm run dev
```

The application will be available at the local development URL provided by the framework.

---

## Environment Variables

Create a `.env.local` file in the project root and add the required environment variables.

```env
# FastAPI URL
FASTAPI_BACKEND_URL=

# Backend API key
BACKEND_API_KEY=

# Other project configuration
```

> Do not commit API keys, credentials, or other secrets to the repository.

---

## Backend

Harvest Rescue uses a Python backend built with **FastAPI**. The backend is responsible for farm registration, data processing, risk assessment, authentication, and communication with external environmental data services.

### Backend Stack

- **Python**
- **FastAPI** - REST API framework
- **Google Earth Engine (GEE)** - satellite and vegetation data
- **Open-Meteo** - weather and climate data
- **SQLite** - local application database
- **SQLAlchemy** - database models and interaction
- **Pydantic** - request and response validation
- **Uvicorn** - ASGI server

### External Data Sources

#### Google Earth Engine

Google Earth Engine is used to access satellite-derived environmental information for farm locations, including vegetation indicators such as **NDVI**.

The backend processes the available satellite observations before incorporating them into the farm risk assessment.

#### Open-Meteo

Open-Meteo provides weather and climate data used by the risk engine to evaluate environmental conditions such as:

- Rainfall
- Temperature
- Precipitation patterns
- Weather anomalies

These signals contribute to the flood, heat, and drought risk assessments.

---

## Backend Architecture

```text
                         Harvest Rescue Frontend
                                  │
                                  │ API Requests
                                  ▼
                         ┌──────────────────┐
                         │   FastAPI API    │
                         └────────┬─────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
                 ▼                ▼                ▼
             Routers          Services         Security
                 │                │
                 │                ├───────────────┐
                 │                │               │
                 ▼                ▼               ▼
             Schemas          Risk Engine     External Data
                                  │          ┌──────┴──────┐
                                  │          │             │
                                  │          ▼             ▼
                                  │       Open-Meteo      GEE
                                  │       Weather       Satellite
                                  │          Data          Data
                                  │
                                  ▼
                            Risk Assessment
                                  │
                                  ▼
                              Database

```

## Data & Intelligence

Harvest Rescue's MVP uses environmental observations as inputs to a rules-based risk assessment system.

The system is intended to make risk signals:

* **Explainable**
* **Traceable**
* **Understandable**
* **Action-oriented**

The risk score should therefore be treated as an **early-warning indicator**, not as a guarantee that crop loss will occur.

---

## Contributing

Contributions, suggestions, and improvements are welcome.

Before submitting a major change, please open an issue to discuss the proposed change.

When contributing:

1. Create a feature branch.
2. Make your changes.
3. Test the affected functionality.
4. Ensure existing functionality is not unnecessarily broken.
5. Submit a pull request with a clear description of the changes.

---

## License

Add the project's license information here.

---

## Harvest Rescue

**Know the risk before you lose the harvest.**
