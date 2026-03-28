# Swasthya Sathi - API Testing Guide (Postman)

This guide provides the sequence of requests to test the **Asha Authentication** and **Patient Management** endpoints.

## 🚀 Setup
- **Base URL:** `http://localhost:5000`
- **Environment:** Development
- **Headers Needed:** `Content-Type: application/json`

---

## 🔐 1. Asha Authentication

### Step 1: Send OTP
- **URL:** `POST /auth/send-otp`
- **Body (JSON):**
```json
{
  "phoneNumber": "9876543210"
}
```
- **Action:** This will return an OTP in the response (for easy testing) and log it in the server console.

### Step 2: Login (Verify OTP)
- **URL:** `POST /auth/login`
- **Body (JSON):**
```json
{
  "phoneNumber": "9876543210",
  "otp": "123456" // Use the OTP received from Step 1
}
```
- **Action:** On success, you will receive a **token**. **Copy this token!**

### Step 3: Get User Details (Auth Check)
- **URL:** `GET /auth/me`
- **Auth:** `Bearer Token` (Paste the token here in Postman's "Auth" tab)
- **Action:** Verifies if the token is valid and returns user info.

---

## 🧾 2. Patient Management (All require Bearer Token)

### Step 1: Create a Patient
- **URL:** `POST /patients`
- **Auth:** `Bearer Token`
- **Body (JSON):**
```json
{
  "name": "Amit Sharma",
  "age": 45,
  "gender": "male",
  "phoneNumber": "9988776655",
  "village": "Palghar"
}
```

### Step 2: Bulk Register (Offline Sync support)
- **URL:** `POST /patients/bulk`
- **Auth:** `Bearer Token`
- **Body (JSON):**
```json
{
  "patients": [
    {
      "name": "Sneha",
      "age": 28,
      "gender": "female",
      "village": "Vada"
    },
    {
      "name": "Rahul",
      "age": 10,
      "gender": "male",
      "village": "Palghar"
    }
  ]
}
```

### Step 3: Search Patients
- **URL:** `GET /patients/search?q=Ami&village=Palghar`
- **Auth:** `Bearer Token`
- **Action:** Searches patients fuzzy-matching the name and/or village.

### Step 4: Get/Update/Delete Patient
- **Get:** `GET /patients/{id}` (Paste patient ID from previous responses)
- **Update:** `PATCH /patients/{id}` (Send partial fields like `{"age": 46}`)
- **Delete:** `DELETE /patients/{id}` (Performs a "soft" delete, removes from search)

---

## 🏥 3. Visits & Medical Records (Nested under Patient)

### Step 1: Create a Visit
- **URL:** `POST /patients/{id}/visits`
- **Auth:** `Bearer Token`
- **Body (JSON):**
```json
{
  "symptoms": ["fever", "cough"],
  "notes": "Patient reports weakness and headache",
  "vitals": {
    "temperature": 101,
    "bloodPressure": "120/80",
    "weight": 65
  },
  "riskLevel": "MEDIUM",
  "aiSuggestion": "Increase fluid intake and rest. Monitor temperature."
}
```

### Step 2: Get Patient History
- **URL:** `GET /patients/{id}/visits`
- **Action:** Returns all visit history for a specific patient, sorted by latest first.

### Step 3: Get Latest Visit
- **URL:** `GET /patients/{id}/visits/latest`
- **Action:** Quickly returns only the most recent visit data.

### Step 4: Add/Update Vitals Only
- **URL:** `POST /patients/{id}/vitals`
- **Body:** `{"temperature": 102}`
- **Note:** This updates the **latest visit of the current day**. If no visit exists for today, it will return an error (you must create a visit first).

---

## 🔳 4. QR System (Patient Identification)

### Step 1: Generate QR for a Patient
- **URL:** `POST /patients/{id}/qr`
- **Auth:** `Bearer Token`
- **Action:** Generates a QR code containing the patient's profile and saves it to their record. Returns the Base64 data URL.

### Step 2: Decode QR (Simulated)
- **URL:** `POST /qr/decode`
- **Auth:** `Bearer Token`
- **Body (JSON):**
```json
{
  "qrData": "BASE64_QR_DATA_HERE"
}
```
- **Action:** Decodes the patient information from the provided data.

---

## 🗣️ 5. Voice Pipeline (Including Async Translation)

> **⚠️ ATTENTION:** The new Translation endpoint (Step 3) requires **Redis** to be running on your system (`localhost:6379`). You must install and start Redis (`redis-server`).

### Step 1: Transcribe Audio
- **URL:** `POST /voice/transcribe`
- **Auth:** `Bearer Token`
- **Body (form-data):**
  - Key: `audio`, Type: `File`, Value: Select a `.wav` or `.mp3`
  - Key: `language`, Type: `Text`, Value: `hi` (Hindi), `mr` (Marathi), etc. 

### Step 2: Queue Async Audio Translation
- **URL:** `POST /voice/translate`
- **Auth:** `Bearer Token`
- **Body (form-data):**
  - Key: `audio`, Type: `File`, Value: Select a `.wav` or `.mp3`
- **Action:** Submits the audio file to the BullMQ background processor for transcription and translation to English.
- **Returns:** `{ "jobId": "uuid-string", "status": "queued" }`

### Step 3: Poll for Translation Status
- **URL:** `GET /voice/translate/{jobId}`
- **Auth:** `Bearer Token`
- **Action:** Retrieves the current state of the in-memory processing.
- **Returns:** `{ "status": "processing" }` or `{ "status": "completed", "translatedText": "Patient has fever and headache..." }`

---

## 🚨 6. AI-Triggered Alerts & Management

These endpoints handle high-risk situations detected by AI.

### Step 1: Trigger a High Risk Alert (Via AI)
- **URL:** `POST /ai/risk-assessment`
- **Auth:** `Bearer Token`
- **Body (JSON):**
```json
{
  "patientId": "PATIENT_ID_HERE",
  "bp": "160/110",
  "weight": 70,
  "symptoms": "Severe headache, blurry vision, swelling in feet",
  "otherFactors": "8th month of pregnancy"
}
```
- **Action:** Since BP is high and symptoms match Preeclampsia, Gemini will return `HIGH` risk. The backend will automatically create an **Alert** record.

### Step 2: View the Active Alerts
- **URL:** `GET /alerts`
- **Auth:** `Bearer Token`
- **Action:** Fetches the alert created in Step 1. ASHA workers see only alerts assigned to them.

### Step 3: Update Alert Status
- **URL:** `PATCH /alerts/{alertId}`
- **Auth:** `Bearer Token`
- **Body:** `{"status": "RESOLVED"}`
- **Action:** Marks the emergency intervention as handled.

### Step 4: Escalate Alert
- **URL:** `POST /alerts/{alertId}/escalate`
- **Auth:** `Bearer Token`
- **Action:** If the situation is not resolving, this sets the alert status to `ESCALATED` and severity to `HIGH`.

---

## 🛠️ Error Handling
- **401 Unauthorized:** Missing or invalid Bearer token.
- **400 Bad Request:** Missing required fields (phone number/otp/patient name).
- **404 Not Found:** Patient or User not found in DB.
