 <div align="center">

# 🩸 FINDBLOOD
### AI-Powered Emergency Blood Assistance Platform

**Find Blood Faster. Connect Donors. Help Save Lives.**

[![Project](https://img.shields.io/badge/Project-FindBlood-dc2626?style=for-the-badge)](https://github.com/raziabegum705/find-blood)
[![AI](https://img.shields.io/badge/AI-Gemini-4285F4?style=for-the-badge)](https://ai.google.dev/)
[![Languages](https://img.shields.io/badge/Languages-English%20%7C%20Hindi%20%7C%20Telugu-orange?style=for-the-badge)](https://github.com/raziabegum705/find-blood)

**Built by Team CODEX**

</div>

---

## 🌍 Problem we found

Imagine someone in your family gets into a serious road accident. You rush them to the hospital, and the doctor tells you, ‘We need blood immediately to save their life.’. The doctor hands them a prescription requesting a specific blood group, but the family does not know where to find available donors or nearby blood banks.

Searching through multiple websites, making phone calls, and explaining the emergency repeatedly wastes valuable time.

**FindBlood aims to simplify this process** by helping people submit blood requests, extract details from a doctor's slip or voice input, discover potential donors, and share emergency alerts.

---

## 🌟 What is FindBlood?

FindBlood is an emergency blood assistance platform designed to make it easier for patients' families to communicate blood requirements and find potential sources of help.

The platform combines AI-assisted information extraction, multilingual interaction, donor discovery, blood bank locations, and emergency notifications in one place.

---

## 🚀 Project Links

| Resource | Link |
|---|---|
| 💻 GitHub Repository | [FindBlood on GitHub](https://github.com/raziabegum705/find-blood) |
| 🔴 Live Demo |https://raziabegum705.github.io/find-blood/ |
| 📹 Demo Video | https://drive.google.com/drive/folders/1fjNL3RiJTpE14g1wEt_qPtJQCHGx9BaY|
| 📊 Project Presentation | https://drive.google.com/drive/folders/1HAwKR_lzXn6jM-F95jNQYTBlA280JfRh |

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎙️ **Voice-Based Requests** | Enter emergency blood requirements using voice input. |
| 🌐 **Multilingual Interface** | Supports English, Hindi, and Telugu for easier interaction. |
| 📄 **Doctor's Slip Upload** | Upload a photo of a doctor's blood requisition slip for AI-assisted extraction of relevant details. |
| 🤖 **AI-Assisted Verification** | Review information extracted from the submitted voice input or document before proceeding. |
| 🩸 **Blood Donor Discovery** | Find potential donors based on relevant blood requirements and available location information. |
| 📲 **Emergency WhatsApp Alerts** | Share blood emergency notifications through the configured WhatsApp integration. |
| 🗺️ **Nearby Blood Banks** | View blood bank locations on a map. |
| 🤝 **Become a Donor** | Provide donor information to help people seeking blood. |
| 🔐 **User Authentication** | Access the available login and signup flows. |
| ✅ **Request Status Flow** | Follow the request flow through donor confirmation and completion screens. |

> **Important:** AI-extracted information should always be checked by the user. Donor discovery and notifications do not guarantee blood availability or a successful match.

---

## 📱 Application Pages

| Page | Purpose |
|---|---|
| 🏠 Home | Introduces the platform and available actions. |
| 🩸 Emergency Request | Starts a blood request. |
| 🎙️ Voice / 📄 Doctor's Slip | Provides emergency details through voice input or a document image. |
| 🤖 AI Verification | Reviews extracted blood requirement information. |
| 🔎 Nearby Donors | Helps discover potential donors. |
| 📲 WhatsApp Alert | Shows the emergency notification flow. |
| 🤝 Donor Confirmation | Displays the donor confirmation step. |
| ✅ Request Completed | Shows the completion screen. |
| 🗺️ Blood Banks | Displays blood bank locations. |
| ❤️ Become a Donor | Opens the donor registration flow. |
| 🔐 Login / Signup | Provides account access screens. |

---

## 📸 Screenshots

### 🏠 Home Page
<img width="645" height="892" alt="image" src="https://github.com/user-attachments/assets/2959438e-92ec-4642-80e2-b3784b7b9b90" />


### 🩸 Emergency Blood Request
<img width="590" height="908" alt="image" src="https://github.com/user-attachments/assets/4ffd2f11-bf78-49ec-8db3-2a3eec04d52a" />


### 📄 Doctor's Slip and AI Verification
<img width="557" height="852" alt="image" src="https://github.com/user-attachments/assets/af3458f9-0ab3-4503-8baf-f268afeb5bee" />
<img width="555" height="847" alt="image" src="https://github.com/user-attachments/assets/49ce66ca-929b-4074-8301-f9db9a4b35bd" />

<img width="556" height="855" alt="image" src="https://github.com/user-attachments/assets/2cceba81-b187-4d7f-bd80-2cd5f7b097a7" />

<img width="533" height="837" alt="image" src="https://github.com/user-attachments/assets/6ec1ab0f-901b-48e5-a66b-99f1a724243a" />

### 🔎 Nearby Donors
<img width="562" height="851" alt="image" src="https://github.com/user-attachments/assets/c4f6ab44-3b29-4ba8-96a8-cdcdf2100b47" />


### 📲 Emergency Alert Flow
<img width="530" height="896" alt="image" src="https://github.com/user-attachments/assets/d087abc4-278f-4139-b172-84ed8544e7f1" />
<img width="568" height="902" alt="image" src="https://github.com/user-attachments/assets/e80ab5ab-bea9-4dab-add2-973429e5b2ae" />



### 🗺️ Blood Bank Locations
<img width="522" height="891" alt="image" src="https://github.com/user-attachments/assets/02d5acf4-1f8f-4a9e-9741-ad4d1268a8bf" />


---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI | Google Gemini API |
| Real-Time Communication | Socket.IO |
| Maps | Leaflet |
| File Uploads | Multer |
| Notifications | WhatsApp integration |
| Configuration | Environment variables |

---

## 🏃 Run Locally

### Prerequisites

- Node.js 20 or later
- Git
- MongoDB connection string
- Gemini API key for AI-assisted extraction
- WhatsApp Cloud API credentials if you want to test the configured WhatsApp integration

### 1. Clone the repository

```bash
git clone https://github.com/raziabegum705/find-blood.git
cd find-blood
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and add the configuration required by your application.

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key

WA_TOKEN=
WA_PHONE_NUMBER_ID=
WA_VERIFY_TOKEN=

CORS_ORIGIN=
```

Fill in the values required for the features you want to run. Check the server code for any additional required variables.

**Security:** Never commit your real API keys, access tokens, or database credentials to GitHub.

### 4. Start the application

```bash
npm start
```

Open the local application at:

`http://localhost:3000`

---

## 🏗️ System Architecture

```text
┌──────────────────────────────────────────────┐
│              USER / BROWSER                  │
│                                              │
│  Home | Emergency Request | Donor Discovery  │
│  Voice Input | Doctor's Slip | Blood Banks   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│            NODE.JS + EXPRESS                 │
│                                              │
│  Request Handling                            │
│  File Upload Processing                      │
│  Donor and Blood Bank Endpoints              │
│  Authentication and Notifications            │
└──────────────┬───────────────┬───────────────┘
               │               │
               ▼               ▼
┌──────────────────────┐  ┌────────────────────┐
│    GEMINI AI         │  │      MONGODB       │
│                      │  │                    │
│ Extract information  │  │ Store application  │
│ from supported input │  │ data as configured│
└──────────────────────┘  └────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│          EMERGENCY ASSISTANCE                │
│                                              │
│ Potential Donors | WhatsApp Alerts           │
│ Blood Bank Locations | Request Status        │
└──────────────────────────────────────────────┘
```
---

## 🔄 How It Works

1. **Start a request:** Open FindBlood and begin the emergency blood request flow.
2. **Share the requirement:** Enter the information using voice input or upload a doctor's blood requisition slip.
3. **Extract and review:** Use the AI-assisted extraction flow and verify the details, including the blood group and required units.
4. **Find potential help:** Explore available donor discovery and blood bank features.
5. **Send an alert:** Use the configured emergency notification flow where available.
6. **Follow the request:** Review the donor confirmation and completion steps in the application.

---

## 🎯 Project Goal

The goal of FindBlood is to make emergency blood assistance easier to understand and use, especially for people who may struggle with complicated websites or language barriers during stressful situations.

By bringing voice input, document-based information extraction, multilingual support, donor discovery, and blood bank locations together, FindBlood aims to reduce the effort required to communicate an urgent blood requirement.

---

## 🔮 Future Scope

- 📍 Improve donor matching using distance and availability information.
- 🏥 Integrate verified blood bank inventory where authorized data sources are available.
- 🌐 Expand support for additional Indian languages.
- 📩 Add more reliable notification and request-status updates.
- 🛡️ Introduce stronger donor verification and privacy protections.
- 📊 Measure request response times and successful connections using verified application data.

---

## 👥 Team

**Team CODEX**

| Member | Role |
|---|---|
| Akash | Project Lead, Team Coordination & Strategy |
| razia  | Full Stack Development / Core Implementation |
| muzammil | Backend Feature Development, Product Planning & Documentation |

---

<div align="center">

### ❤️ Technology with a Human Purpose

**FindBlood — Helping People Find Potential Blood Assistance When It Matters.**

Built with ❤️ by Team **CODEX**.
For **innovators conclave 2026**
</div>
