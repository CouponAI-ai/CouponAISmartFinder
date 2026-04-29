# 🧠 CouponAI Smart Finder — AI-Powered Deal Discovery

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Tech](https://img.shields.io/badge/stack-React%20%7C%20Node%20%7C%20PostgreSQL-blue)
![Project](https://img.shields.io/badge/type-capstone-lightgrey)

**Smart Findings, Powered by AI**

CouponAI Smart Finder is an AI-powered platform that helps users discover **verified, location-aware deals in real time**. By combining geolocation, curated coupon databases, and intelligent ranking, the system ensures users see only the most relevant and valid offers nearby.

---

## 🚀 Features

* **📍 Location-Based Discovery**
  Finds nearby businesses using ZIP code geocoding and map-based search

* **✅ Verified Coupon Database**
  Curated deals from sources like SimplyCodes, CouponFollow, and RetailMeNot

* **🧠 AI-Powered Recommendations**
  Predicts coupon validity and relevance using probabilistic models

* **🗺️ Interactive Map UI**
  Displays nearby stores and deals using map visualization

* **⚡ Real-Time Results**
  Dynamically fetches and ranks deals based on distance and accuracy

---

## 🏗️ Pipeline

```
ZIP Code → Geocode (Nominatim) → Fetch Businesses (Overpass) → Rank (Haversine + AI) → Display Deals
```
---

## 🛠️ Tech Stack

**Frontend**
React, TypeScript, Tailwind CSS, React Leaflet

**Backend**
Node.js, Express.js

**Database**
PostgreSQL + Drizzle ORM

**APIs & Tools**
OpenStreetMap, Nominatim, Overpass API, OpenAI

**Processing & Logic**
Haversine Formula (distance calculation)
Geocoding (ZIP → coordinates)

---

## ⚙️ Setup

```bash
git clone https://github.com/CouponAI-ai/CouponAISmartFinder
cd CouponAISmartFinder
npm install
npm start
```

---

## 🔐 Security

* Input validation across all APIs and forms
* API response limits to prevent abuse
* Secure server-side API key handling
* AI chatbot guardrails against prompt injection
* Generic error handling (no system leaks)

---

## 🧪 Key Results

* Curated database prevents API rate-limit failures (429 errors)
* ZIP boundary filtering improves geolocation accuracy
* Brand aliasing increased match rate by ~40%
* Scalable architecture for expansion

---

## 🧱 System Architecture

* **Geocoding:** Nominatim converts ZIP → coordinates
* **Distance Calculation:** Haversine formula ranks proximity
* **Database:** Structured coupon storage with expiration tracking
* **AI Layer:** Optimized model for fast and cost-efficient predictions

---

## 👥 Collaborators

* **Rory Lowther** — UI, Poster, Presentation
* **Malachi Pumphery** — AI Integration & Backend Logic
* **Cameron Hartefields** — Geolocation & Location Services
* **Brodie** — Documentation & Chatbot

---

## 📌 Problem & Motivation

* ~30% of coupons fail across platforms
* Deals are often irrelevant or too far away
* Users waste time on invalid offers
* Businesses lose potential customers

CouponAI solves this by combining **location accuracy + verification + AI filtering**

---

## 🔮 Future Improvements

* User accounts and saved deals
* Push notifications for expiring coupons
* Expanded store and restaurant coverage
* Personalized AI recommendations
* Mobile app version

---

## 🌐 Live Demo

https://couponai.io

---

## ⭐ Notes

This private project is supervised by [Dr. Ahmad Al-Shami](https://github.com/alshami10), who has repository access solely for academic guidance, review, and assessment purposes.

