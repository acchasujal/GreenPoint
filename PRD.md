# Project: GreenPoint Mumbai - Civic Compliance Prototype

## Core Objective
[cite_start]Address the 60% motivation gap and 50% trust gap in Mumbai waste management through a unified Reward-Penalty ledger[cite: 335, 336, 365].

## Core Logic (Feature 1: Reward System)
- [cite_start]**Daily Reward:** +10 GreenPoints for correct wet/dry segregation.
- [cite_start]**Recyclable Drop-off:** +5 GreenPoints per kg.
- [cite_start]**Wallet Balance:** Real-time display for citizens[cite: 251].

## Core Logic (Feature 2: Penalty System)
[cite_start]Follow a **Graduated Enforcement Model** on a rolling 30-day window[cite: 291]:
1. [cite_start]**1st Offense:** Warning + 20 point deduction (Never a monetary fine first)[cite: 293, 294].
2. [cite_start]**2nd Offense:** 50 point deduction + Society notification.
3. [cite_start]**3rd Offense:** ₹200 BMC monetary fine.

## Multilingual Warning Strings (Critical for Review)
- **English:** "Warning: Non-segregated waste detected. 20 points deducted."
- **Hindi:** "चेतावनी: कचरा अलग नहीं किया गया है। 20 अंक काटे गए।"
- [cite_start]**Marathi:** "सूचना: कचरा वर्गीकरण आढळले नाही. 20 गुण वजा केले आहेत।"[cite: 260].

## Data Requirements
- [cite_start]Every action must be timestamped, geo-tagged, and linked to a `collector_id` to ensure accountability[cite: 277, 295].
- [cite_start]Minimum redemption threshold: 100 points (₹20 equivalent)[cite: 288].