OSMANI MEDICAL COLLEGE HOSPITAL
Hospital Management System with AI Report Chat

PROJECT OVERVIEW
A fictional hospital-management demo built with plain HTML, CSS, and JavaScript.
The website stores demo records in the browser's localStorage. A local Node.js
server serves the website and connects the AI report chat to ChatterMate.
Use fictional information only. Do not enter real patient or health data.

PROJECT FILES
index.html       Dashboard
patients.html    Patient registration and search
visits.html      Doctor visits and prescriptions
lab.html         Lab tests and results
billing.html     Billing and payments
reports.html     Date-filtered reports and print view
chat.html        AI report chat
style.css        Shared page styling
 data.js         Shared browser data and sample-data functions
server.js        Local website server and ChatterMate API proxy
.env             Local API key file — never include in the submission ZIP

REQUIREMENTS
- Node.js installed on your computer
- A ChatterMate API key for the AI report chat
- A modern web browser

RUNNING THE WEBSITE
1. Keep all project files together in one folder.
2. Create a file named .env in the same folder as server.js, if your Node.js
   version supports --env-file. Put this line in the file:

   CHATTERMATE_API_KEY=your_private_api_key

   Replace the example with your own key. Do not share this file.

3. Open PowerShell in the project folder.

4. If using a recent Node.js version that supports --env-file, run:

   node --env-file=.env server.js

   If using Node.js v16, set the key privately in that PowerShell window first.
   Run each command separately and paste the key only at the hidden prompt:

   $secure = Read-Host "Paste your API key" -AsSecureString
   $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
   $env:CHATTERMATE_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
   [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
   node server.js

5. Keep PowerShell open while using the site.
6. Open this address in your browser:

   http://localhost:3000

7. On the dashboard, use Load Sample Data to populate the demo records.

STOPPING THE SERVER
In the PowerShell window running the server, press Ctrl+C.

TESTING CHECKLIST
- Load the fictional sample data from the dashboard.
- Add and search for a fictional patient; refresh and check persistence.
- Add a doctor visit and prescription for a saved patient.
- Add a lab test, update its status, and enter a fictional result.
- Record a payment and check total, paid, and due amounts.
- Use the report date filters; compare report totals with the saved records.
- Try the report Print buttons.
- Ask the AI chat report questions and compare numeric answers with Reports.
- Confirm the assistant says when report data does not contain an answer.
- Confirm it refuses requests to change or delete records.

AI CHAT AND SECURITY
The browser must not receive the ChatterMate API key. Keep the key only in the
server environment or local .env file. Never place it in HTML, browser-side
JavaScript, screenshots, videos, or a public repository. If a key is exposed,
revoke it and create a replacement.

The chat is intended to answer questions from report data only. The demo uses
localStorage and fictional records; it is not suitable for real patient data or
production use.

CHATTERMATE CHAT SHARE LINKS
Add a share link for every ChatterMate conversation used to build and test this
project, including the planning conversation and the AI-chat conversation.

Planning chat: ______________________________________________
Website development chat: ___________________________________
Reports chat: _______________________________________________
AI chat / server connection chat: ____________________________
Other project chats: _________________________________________

SUBMISSION CHECKLIST
- Project folder compressed as a ZIP
- README.txt with all ChatterMate share links completed
- Demo video, 3–5 minutes long, showing sample data, each screen, reports, and
  at least five questions to the AI report chat
- .env excluded from the submission ZIP
- No API key or real patient data in the ZIP, screenshots, or video
