TripTally – UI Design Spec (First Draft)

Screens (each is a separate page with its own URL):
1. Trip setup – URL: /
   Figma: https://www.figma.com/design/4v8wTqqVjXjQOjSiMPUmAC/Untitled?node-id=2-1151
2. Upload spend details – URL: /upload
   Figma: https://www.figma.com/design/4v8wTqqVjXjQOjSiMPUmAC/Untitled?node-id=2-1276
3. Dashboard – URL: /dashboard
   Figma: https://www.figma.com/design/4v8wTqqVjXjQOjSiMPUmAC/Untitled?node-id=2-1396

Flow:
- "Continue" on / → goes to /upload
- "Next" on /upload → goes to /dashboard
- "Evaluate" on /upload → shown, no action for now (Braintrust is added later)

Figma source:
- The design already exists in Figma. Do not create a new file; use this existing file.
- All 3 screens are on one page, each as a separate frame:
  "1 – Trip setup (/)", "2 – Upload spend details (/upload)", "3 – Dashboard (/dashboard)"
- Use the Figma URLs listed above for each screen as the visual reference.

Overall style:
- TripTally is a web app that splits group trip expenses.
- Very minimal and professional: lots of white space, neutral greys, one accent color (dark green), a single clean sans-serif font (Inter), no illustrations or decoration.
- Desktop frame 1440x1024. On every screen, center the content in a 640px column.
- Keep the same styles across all screens (colors, font, spacing, buttons, tooltips).
- Keep the spacing between sections the same on every screen.

Tooltip style (all screens):
- Small grey info icon (ⓘ, 14px, #9CA3AF) next to the label or button it explains; next to a button, center the icon vertically with the button, 8px to its right
- Tooltip: #111827 background, white 13px text, 8px rounded corners, 8px 12px padding, max width 240px, small pointer arrow
- Each tooltip is one short, plain-language sentence so a first-time user knows what to do
- In the Figma design, show one tooltip open per screen as an example; in the app, tooltips appear on hover only

Screen 1 – Trip setup (/)
- Heading: "TripTally"
- Text field: "Trip name" (placeholder: e.g. Goa Trip)
  ⓘ "Give your trip a name so you can recognise it later."
- Trip type: single-select with two choices: "Only Friends" and "With Friends & Families"
  ⓘ "Choose who is on this trip. This helps label your trip summary."
- Friends on this trip:
  - Label: "Friends on this trip" (same style as the other labels)
    ⓘ "Enter the name and email of each friend on this trip. They'll get the settlement by email."
  - 3 friend rows stacked vertically, 12px apart, full content width
  - Each row has two fields side by side, 12px gap, same style as the Trip name field:
    - Left: name field, 50% width (placeholders: "Friend 1 name", "Friend 2 name", "Friend 3 name")
    - Right: email field, 50% width (placeholders: "friend1@email.com", "friend2@email.com", "friend3@email.com")
  - Below the rows, a text button: "+ Add friend" (accent color, 14px medium, no border)
    Clicking it adds a new row with both a name and an email field
    ⓘ "Add another friend who was on this trip."
- Primary button: "Continue", with the same spacing above it as between the other sections
  ⓘ "Go to the next step to upload your spend details."

Screen 2 – Upload spend details (/upload)
- Heading: "Upload spend details"
- Label: "Upload file"
  ⓘ "Upload a .txt file listing who paid what during the trip."
- Upload area (dashed border, light grey background): "Drop your spend details file here", "or browse files" (link), hint ".txt files only"
- After upload, show a selected-file row: file name (e.g. goa-trip.txt), "Selected file", and a remove (×) icon
- Info note directly above the button row (Evaluate and Next): "This evaluation is run with test data."
  Style: light amber background (#FEF3C7), dark amber text (#92400E), 13px, 8px rounded corners, small info icon
- Secondary button: "Evaluate" (white background, 1px dark green border, dark green text)
  ⓘ "Runs the AI on test data in Braintrust to check its accuracy."
- Primary button: "Next", to the right of Evaluate's ⓘ icon, 16px gap
  ⓘ "Go to your trip summary and see who pays whom."

Screen 3 – Dashboard (/dashboard)
- Header: "Goa Trip · Friends" (24px semibold), with a thin divider below it

Table 1 – Summary
- Section title: "Summary" (18px semibold), 24px gap below the header divider
  ⓘ "Total trip cost, number of people, and what each person's equal share is."
- White card, 1px border (#E5E7EB), 12px rounded corners, subtle shadow, full content width
- 3 equal columns with 1px vertical dividers (#E5E7EB)
- Header row: #F9FAFB background, 13px semibold uppercase labels in #6B7280, centered:
  TOTAL COST | PEOPLE | SHARE EACH
- Value row: 64px tall, centered, 22px semibold in #111827:
  ₹2,000 | 4 | ₹500

Table 2 – Who pays whom
- Section title: "Who pays whom" (18px semibold), 24px gap below Table 1
  ⓘ "The fewest payments needed to settle everyone up."
- White card, 1px border (#E5E7EB), 12px rounded corners, subtle shadow, full content width
- Column widths: Who pays 40% | To whom 40% | Amount 20%
- Header row: #F9FAFB background, 13px semibold uppercase labels in #6B7280:
  WHO PAYS (left) | TO WHOM (left) | AMOUNT (right)
- Body rows: 52px tall, 16px horizontal padding, 15px regular text in #111827
- 1px divider (#F1F5F9) between rows, alternating row shading (white / #FAFAFA)
- Amount column right-aligned, with tabular figures
- Rows:
  Neha | Rajan | ₹500
  Amit | Rajan | ₹200
  Amit | Priya | ₹100
- Total row: #F3F4F6 background, 2px top border (#E5E7EB), bold text;
  "Total settled" spans the first two columns, "₹800" right-aligned under Amount

- Primary button: "Approve & notify", right-aligned below Table 2, 24px gap
  ⓘ "Approve this split, save it, and email each friend what they owe and to whom."