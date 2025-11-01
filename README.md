[README.md](https://github.com/user-attachments/files/23283052/README.md)
# 🧩 ClickUp Gmail Helper Extension

A Chrome extension that connects Gmail to ClickUp.  
It automatically detects the ClickUp task from the current email (based on `@tasks.clickup.com`) and displays full task details directly inside the popup.

---

## 🚀 Features

✅ Automatically detects the ClickUp task linked in the email  
✅ Shows task details (title, status, priority, assignees, etc.)  
✅ Opens task directly in ClickUp  
✅ Secure OAuth login using your own ClickUp app  
✅ Works per Gmail account

> ⚠️ **Note:** If you open a new Gmail tab or switch accounts, you may need to **refresh the browser** once to see updated task details. (We’re improving this behavior.)

---

## 🛠️ Project Setup Guide (Manual)

Follow these steps carefully to run the project on your own system.

---

### 🔹 1. Clone the Repository
```bash
git clone https://github.com/your-username/clickup-gmail-extension.git
cd clickup-gmail-extension
```

---

### 🔹 2. Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file inside `/backend`  
   You can copy this from `.env.example` and fill in your details.

   Example:
   ```bash
   PORT=5000
   MONGO_URI=your_mongodb_url
   CLICKUP_CLIENT_ID=your_clickup_client_id
   CLICKUP_CLIENT_SECRET=your_clickup_client_secret
   CLICKUP_REDIRECT_URI=http://localhost:5000/auth/clickup/callback
   CLICKUP_BASE_URL=https://api.clickup.com/api/v2
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   You should see something like:
   ```
   ✅ Server running on http://localhost:5000
   ✅ MongoDB Connected
   ```

---

### 🔹 3. Frontend Setup (Extension)

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update backend URL (if needed):  
   Open `/src/config.js` and update this:
   ```js
   export const CONFIG = {
     API_BASE_URL: "http://localhost:5000", // or your deployed backend URL
   };
   ```

4. Build the extension:
   ```bash
   npm run build
   ```

   This will create a `dist` folder.

---

### 🔹 4. Load the Extension in Chrome

1. Open **Chrome** and go to:
   ```
   chrome://extensions/
   ```

2. Turn on **Developer mode** (toggle in top right).

3. Click **Load unpacked**.

4. Select the `frontend/dist` folder.

5. You should now see your extension icon in Chrome’s toolbar.

---

### 🔹 5. Connect Your ClickUp Account

1. Click on the extension icon.  
2. Click the **“Connect ClickUp”** button.  
3. A popup will appear asking you to authorize your ClickUp account.  
4. Once connected, your email will show as connected.  

---

### 🔹 6. Test in Gmail

1. Open **Gmail**.  
2. Open any email that contains a `@tasks.clickup.com` address in CC or content.  
3. Open your extension popup — it should display the detected task details automatically.  
4. If it doesn’t, **refresh the Gmail tab once** and open the popup again.

---

## ⚠️ Important Notes

- Gmail is a **Single Page App**, so sometimes it doesn’t trigger content updates instantly.  
  → If task info doesn’t change, just **refresh the Gmail tab**.  
- Each user must use **their own ClickUp OAuth credentials** (client ID, secret, redirect URI).  
- Make sure `CLICKUP_REDIRECT_URI` in your ClickUp app **exactly matches** your backend route.

---

## 🔐 Environment Variables Explained

| Variable | Description |
|-----------|-------------|
| **PORT** | Local server port (default 5000) |
| **MONGO_URI** | Your MongoDB connection string |
| **CLICKUP_CLIENT_ID** | From ClickUp Developer App |
| **CLICKUP_CLIENT_SECRET** | From ClickUp Developer App |
| **CLICKUP_REDIRECT_URI** | Must match the callback route in ClickUp app |
| **CLICKUP_BASE_URL** | Always `https://api.clickup.com/api/v2` |

---

## 🧑‍💻 Developer Tips

- Do **not** commit your `.env` file to GitHub — keep it private.  
- Instead, include a `.env.example` file with placeholders.  
- For deployment, update your frontend `API_BASE_URL` to your hosted backend URL.

---

## ❤️ Credits

Built by **Yogesh Joshi**  
Designed to make Gmail–ClickUp workflow simpler and faster.
