TripTally – Project Context

1. Business case
- What: a web app that settles shared expenses after a group trip.
- Problem: after a trip, working out fair shares and who owes whom is manual, error-prone and awkward.
- Users: the trip organiser (main user) and the friends or family on the trip.
- Value: a quick, fair, transparent settlement with the fewest payments, approved by the organiser, and everyone notified by email.
- First version: trip setup → .txt upload → AI reads the spends → code calculates the split → settlement summary → approve & notify. Evaluate runs the existing test dataset in Braintrust.
- Learning goal: learn how an AI-coded app integrates with Braintrust (evals) and PostHog (product analytics), end to end.

2. Tech stack
- Design: Figma
- App: Claude Code (web app)
- AI: Claude (Anthropic API), used only to read and rewrite spend lines
- Database: Supabase
- Code: Git
- Deploy: Vercel
- Evals: Braintrust (on Evaluate: runs the dataset through the app's analyser; LLM judge scores each row 1 or 0)
- Notifications: Gmail (on Approve & notify, the app sends the email from the organiser's Gmail account)
- Product analytics: PostHog (events, funnel, conversion dashboard, feature flags)

3. UI design
The UI must be built exactly from design.md and the Figma designs below: layout, styles, copy and tooltips.
- / – Trip setup
  https://www.figma.com/design/4v8wTqqVjXjQOjSiMPUmAC/Untitled?node-id=2-1151
- /upload – Upload spend details
  https://www.figma.com/design/4v8wTqqVjXjQOjSiMPUmAC/Untitled?node-id=2-1276
- /dashboard – Dashboard
  https://www.figma.com/design/4v8wTqqVjXjQOjSiMPUmAC/Untitled?node-id=2-1396

4. Data model (Supabase)
Table: trips
- id          uuid, primary key
- name        text, required          (e.g. "Goa Trip")
- trip_type   text, required          ("Only Friends" | "With Friends & Families")

Table: friends
- id          uuid, primary key
- trip_id     uuid, required, foreign key → trips.id
- name        text, required
- email       text, required

Table: settlements
- id          uuid, primary key
- trip_id     uuid, required, foreign key → trips.id
- payer       text, required          (who pays)
- payee       text, required          (to whom)
- amount      numeric, required

5. Roles
- Claude (AI): reads each spend line and rewrites it as "Name - amount - item" ("missing" if a part is absent, "invalid" if the amount is not a number). Nothing else.
- Code: checks the rewritten lines against the trip's friends, calculates the split, saves, and sends emails.

6. Design flow
/ – Trip setup
  User enters trip name, trip type and each friend's name and email (3 rows, "+ Add friend" for more) → Continue
  Saved to Supabase (trips, friends) · PostHog: trip_created

/upload – Upload spend details
  User uploads a .txt file
  - The app passes the list of spends (all lines of the file) to the analyser; Claude rewrites every line.
  - The code checks every line: the name must be one of the trip's friends, and the amount must be present and a number. If any line is wrong, the wrong lines are listed and Next stays disabled.
  - Otherwise, the code calculates the split (total, share each, who pays whom). It is shown on /dashboard and saved only on Approve & notify.
  User clicks Next → goes to /dashboard
  User clicks Evaluate → runs the dataset in Braintrust: each test line goes through the same analyser, the LLM judge scores it 1 or 0, and the results are saved as an experiment. Nothing is saved to Supabase.
  PostHog: evaluate_clicked

/dashboard – Dashboard
  Header shows the trip name and type from Screen 1 (e.g. "Goa Trip · Friends")
  Shows the Summary and Who pays whom tables from the split
  The "Approve & notify" button is shown only when the notification feature flag is on (PostHog)
  On click (the organiser approves the split):
    1. The split is saved to Supabase (settlements)
    2. The app sends an email through Gmail to each friend, with the Who pays whom table
  After the click, a "Notification sent" confirmation is shown on the same screen (no page change)
  PostHog: approve_notify_clicked

PostHog funnel: trip_created → evaluate_clicked → approve_notify_clicked
Feature flag: notification toggle, which turns "Approve & notify" on or off.
