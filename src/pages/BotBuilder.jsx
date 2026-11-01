import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  Handle,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

const API_BASE_URL = "https://api.promiapi.com"; // default fallback

// Plan Limit Helper Function
const getFlowLimitByPlan = (planInput) => {
  if (!planInput) return 1;
  const planStr = planInput.toString().toLowerCase();

  if (planStr.includes("standard")) return 5;
  if (planStr.includes("premium")) return 10;
  if (planStr.includes("ultimate")) return Infinity;
  return 1; 
};

// ==========================================
// 🔔 MODERN TOAST NOTIFICATION COMPONENT
// ==========================================
const ToastNotification = ({ toast, onClose }) => {
  if (!toast.show) return null;

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  const bannerStyle = {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 18px",
    borderRadius: "8px",
    backgroundColor: isSuccess ? "#0f172a" : isError ? "#7f1d1d" : "#1e293b",
    color: "#ffffff",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
    borderLeft: `5px solid ${isSuccess ? "#22c55e" : isError ? "#ef4444" : "#3b82f6"}`,
    fontSize: "13px",
    fontWeight: "600",
  };

  return (
    <div style={bannerStyle}>
      <span>{isSuccess ? "🚀" : isError ? "⚠️" : "ℹ️"}</span>
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#94a3b8",
          cursor: "pointer",
          fontSize: "14px",
          marginLeft: "10px",
        }}
      >
        ✕
      </button>
    </div>
  );
};

// ==========================================
// 📋 12 FULLY BRANCHED PROFESSIONAL TEMPLATES
// ==========================================
const TemplatesModal = ({ show, onClose, onSelectTemplate }) => {
  if (!show) return null;

  const templates = [
    {
      id: "bank",
      title: "🏦 Bank CBS & Account Support Bot",
      description: "Fully branched flow where Option 1 (Balance), Option 2 (Loan), and Option 3 (Card Block) have distinct response nodes.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "hi, hello, bank, 1", level: "ANY", nextLevel: "BANK_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Welcome to National Bank Portal. Choose option:", buttons: ["1. Balance", "2. Loan", "3. Card Block"], level: "BANK_MENU", nextLevel: "BANK_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "Please provide your Account Number to check your current Balance.", level: "BANK_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "Our personal loan interest rates start at 14%. Enter desired amount.", level: "BANK_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "To temporarily block your debit card, please enter your CNIC.", level: "BANK_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "ecommerce",
      title: "🛒 E-Commerce Store & Tracking Bot",
      description: "Branched flow for Option 1 (Track Order), Option 2 (Browse Catalog), and Option 3 (Return Policy).",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "hi, store, order, track", level: "ANY", nextLevel: "SHOP_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Welcome to our Store! How can we assist?", buttons: ["1. Track Order", "2. Browse Catalog", "3. Return Policy"], level: "SHOP_MENU", nextLevel: "SHOP_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "Please reply with your Order ID (e.g. #1024) to check status.", level: "SHOP_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "Check out our latest seasonal arrivals on our website catalog.", level: "SHOP_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Items can be exchanged or returned within 7 days of delivery.", level: "SHOP_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "realestate",
      title: "🏠 Real Estate Property Inquiry Bot",
      description: "Branched options for Buy House, Rent Apartment, and Commercial Plots.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "property, house, rent, buy", level: "ANY", nextLevel: "REAL_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Looking for property in Lahore? Select requirement:", buttons: ["1. Buy House", "2. Rent Apartment", "3. Commercial"], level: "REAL_MENU", nextLevel: "REAL_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "Great! What is your preferred location and budget for buying?", level: "REAL_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "We have furnished and unfurnished apartments available for rent.", level: "REAL_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Commercial plazas and office spaces are available in Gulberg & DHA.", level: "REAL_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "hospital",
      title: "🏥 Hospital & Clinic Appointment Bot",
      description: "Branched options for Doctor Booking, OPD Timings, and Lab Reports.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "doctor, appointment, hospital, clinic", level: "ANY", nextLevel: "CLINIC_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Welcome to City Health Clinic. Choose service:", buttons: ["1. Book Doctor", "2. OPD Timings", "3. Lab Reports"], level: "CLINIC_MENU", nextLevel: "CLINIC_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "Please select department: General Physician, Cardiologist, or Dentist.", level: "CLINIC_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "Morning OPD: 9 AM - 2 PM. Evening OPD: 5 PM - 9 PM daily.", level: "CLINIC_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Please provide your Lab Receipt Number to download reports.", level: "CLINIC_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "restaurant",
      title: "🍕 Restaurant Table & Food Ordering Bot",
      description: "Branched options for Order Food, Table Booking, and Special Offers.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "food, menu, order, pizza, restaurant", level: "ANY", nextLevel: "FOOD_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Welcome to Gourmet Bistro! What would you like?", buttons: ["1. Order Food", "2. Table Booking", "3. Offers"], level: "FOOD_MENU", nextLevel: "FOOD_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "Please share what you'd like to order from our menu.", level: "FOOD_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "For table reservation, please tell us date, time, and guest count.", level: "FOOD_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Today's Special: Buy 1 Large Pizza and get 1 1.5L drink free!", level: "FOOD_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "travel",
      title: "✈️ Travel Agency & Tour Booking Bot",
      description: "Branched options for Tour Packages, Flight Booking, and Visa Help.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "travel, tour, flight, hotel", level: "ANY", nextLevel: "TRAVEL_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Explore Dream Tours & Travels:", buttons: ["1. Tour Packages", "2. Flight Booking", "3. Visa Help"], level: "TRAVEL_MENU", nextLevel: "TRAVEL_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "We offer tour packages for Skardu, Naran, and Dubai.", level: "TRAVEL_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "Please provide departure city, destination, and travel dates.", level: "TRAVEL_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "We provide complete consultation for tourist and visit visas.", level: "TRAVEL_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "saas",
      title: "💻 SaaS Software & Tech Support Bot",
      description: "Branched options for API Setup, Pricing Plans, and Report Bug.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "support, api, pricing, login, saas", level: "ANY", nextLevel: "SAAS_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "PromiAPI Support Center. How can we help?", buttons: ["1. API Setup", "2. Pricing Plans", "3. Report Bug"], level: "SAAS_MENU", nextLevel: "SAAS_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "Check out our developer docs for Webhooks and Meta API integration.", level: "SAAS_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "We offer Standard, Premium, and Ultimate plans starting at $29/mo.", level: "SAAS_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Please paste your error logs or describe the bug encountered.", level: "SAAS_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "education",
      title: "🎓 Education & Online Course Bot",
      description: "Branched options for View Courses, Fee Structure, and Register Now.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "course, admission, class, study", level: "ANY", nextLevel: "EDU_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Welcome to DigiSkills & Training Portal:", buttons: ["1. View Courses", "2. Fee Structure", "3. Register Now"], level: "EDU_MENU", nextLevel: "EDU_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "We offer Web Development, Graphic Design, and Digital Marketing.", level: "EDU_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "All professional batch courses are currently 100% free of cost.", level: "EDU_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Please provide your full name and email address to enroll.", level: "EDU_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "fitness",
      title: "🏋️ Gym & Fitness Center Bot",
      description: "Branched options for Membership, Personal Trainer, and Timings.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "gym, fitness, workout, trainer", level: "ANY", nextLevel: "FIT_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Welcome to Iron Gym Fitness Club:", buttons: ["1. Membership", "2. Personal Trainer", "3. Timings"], level: "FIT_MENU", nextLevel: "FIT_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "Monthly gym membership is PKR 5,000 with unlimited access.", level: "FIT_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "One-on-one personal training sessions are available upon request.", level: "FIT_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Gym is open daily from 6:00 AM to 11:00 PM.", level: "FIT_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "automotive",
      title: "🚗 Car Rental & Service Booking Bot",
      description: "Branched options for Rent a Car, Car Service, and Chauffeur.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "car, rent, service, vehicle, rentacar", level: "ANY", nextLevel: "AUTO_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Welcome to Prime Car Rental & Service:", buttons: ["1. Rent a Car", "2. Car Service", "3. Chauffeur"], level: "AUTO_MENU", nextLevel: "AUTO_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "We have Sedan, SUV, and Luxury cars available for daily rent.", level: "AUTO_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "Book periodic maintenance, oil change, and tuning online.", level: "AUTO_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Professional verified drivers available for local and outstation trips.", level: "AUTO_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "insurance",
      title: "🛡️ Insurance & Policy Renewal Bot",
      description: "Branched options for Get Quote, File Claim, and Renew Policy.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "insurance, policy, claim, health", level: "ANY", nextLevel: "INS_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Welcome to SecureLife Insurance Portal:", buttons: ["1. Get Quote", "2. File Claim", "3. Renew Policy"], level: "INS_MENU", nextLevel: "INS_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "Please specify if you need Health, Auto, or Life insurance quote.", level: "INS_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "Please upload your medical bills or accident photos to file claim.", level: "INS_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Enter your Policy Number to instantly check renewal status.", level: "INS_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    },
    {
      id: "events",
      title: "🎉 Event Management & Ticket Booking Bot",
      description: "Branched options for Buy Tickets, Book Event, and Schedule Call.",
      nodes: [
        { id: "node-1", type: "triggerNode", data: { keyword: "event, ticket, concert, wedding", level: "ANY", nextLevel: "EVENT_MENU" }, position: { x: 400, y: 50 } },
        { id: "node-2", type: "buttonsNode", data: { title: "Welcome to Elite Event Planners & Ticketing:", buttons: ["1. Buy Tickets", "2. Book Event", "3. Schedule Call"], level: "EVENT_MENU", nextLevel: "EVENT_ACTION" }, position: { x: 400, y: 220 } },
        { id: "node-3", type: "messageNode", data: { message: "Select concert or event from our upcoming schedule list.", level: "EVENT_ACTION", nextLevel: "ANY" }, position: { x: 50, y: 480 } },
        { id: "node-4", type: "messageNode", data: { message: "We manage weddings, corporate seminars, and birthday parties.", level: "EVENT_ACTION", nextLevel: "ANY" }, position: { x: 400, y: 480 } },
        { id: "node-5", type: "messageNode", data: { message: "Our event coordinator will call you back within 2 business hours.", level: "EVENT_ACTION", nextLevel: "ANY" }, position: { x: 750, y: 480 } }
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2", animated: true, style: { strokeWidth: 3, stroke: "#64748b" } },
        { id: "e2-3", source: "node-2", target: "node-3", sourceHandle: "btn_output_0", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-4", source: "node-2", target: "node-4", sourceHandle: "btn_output_1", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } },
        { id: "e2-5", source: "node-2", target: "node-5", sourceHandle: "btn_output_2", animated: true, style: { strokeWidth: 3, stroke: "#d97706" } }
      ]
    }
  ];

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalBody, maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>Select Professional Bot Template (Fully Branched)</h3>
        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "15px" }}>
          Each template now features distinct multi-branch response nodes for all 3 interactive options (Option 1, 2, and 3).
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {templates.map((tpl) => (
            <div key={tpl.id} style={styles.templateCard} onClick={() => onSelectTemplate(tpl)}>
              <div style={{ fontWeight: "700", fontSize: "13px", color: "#1e293b", marginBottom: "4px" }}>{tpl.title}</div>
              <div style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.3" }}>{tpl.description}</div>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={styles.btnSecondary}>Cancel</button>
      </div>
    </div>
  );
};

// ==========================================
// 💳 PLAN UPGRADE MODAL
// ==========================================
const UpgradeModal = ({ show, onClose, currentPlan, flowCount, maxLimit }) => {
  if (!show) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalBody, width: "420px", textAlign: "center" }}>
        <div style={{ fontSize: "36px", marginBottom: "8px" }}>🚀</div>
        <h3 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>Flow Limit Reached</h3>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px", lineHeight: "1.5" }}>
          You are on the <strong style={{ textTransform: "capitalize", color: "#2563eb" }}>{currentPlan}</strong> plan 
          and have reached your maximum limit of <strong>{maxLimit === Infinity ? "Unlimited" : maxLimit}</strong> active visual flows ({flowCount}/{maxLimit === Infinity ? "∞" : maxLimit}).
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          <div style={styles.planCard}>
            <div>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Standard Plan</strong>
              <div style={{ fontSize: "11px", color: "#64748b" }}>5 Visual Bot Flows</div>
            </div>
            <span style={styles.badge}>5 Flows</span>
          </div>

          <div style={styles.planCard}>
            <div>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Premium Plan</strong>
              <div style={{ fontSize: "11px", color: "#64748b" }}>10 Visual Bot Flows</div>
            </div>
            <span style={styles.badge}>10 Flows</span>
          </div>

          <div style={styles.planCard}>
            <div>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Ultimate Plan</strong>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Unlimited Visual Bot Flows</div>
            </div>
            <span style={{ ...styles.badge, background: "#dcfce7", color: "#15803d" }}>Unlimited</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={styles.btnSecondary}>Close</button>
          <button 
            onClick={() => {
              window.location.href = "/dashboard/subscription";
            }} 
            style={styles.btnPrimary}
          >
            Upgrade Subscription Plan ⚡
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🔥 SECURE MEDIA WRAPPER
// ==========================================
const SecureMediaWrapper = ({ src, type, style }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState(false);

  useEffect(() => {
    let active = true;
    let localBlobUrl = null;

    const loadMediaSecurely = async () => {
      if (!src) return;

      if (src.startsWith("blob:") || src.startsWith("data:")) {
        if (active) {
          setObjectUrl(src);
          setLoading(false);
        }
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(src, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: "blob",
        });

        if (active) {
          localBlobUrl = URL.createObjectURL(response.data);
          setObjectUrl(localBlobUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Media load error:", err.message);
        if (active) {
          setObjectUrl(src);
          setLoading(false);
        }
      }
    };

    loadMediaSecurely();

    return () => {
      active = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [src]);

  if (loading) return <div style={{ fontSize: "10px", color: "#64748b" }}>Loading Media...</div>;
  if (error) return <div style={{ fontSize: "10px", color: "#ef4444" }}>⚠️ Media Error</div>;

  if (type === "video") {
    return <video src={objectUrl} controls style={style} />;
  }
  return <img src={objectUrl} alt="Preview" style={style} />;
};

// ==========================================
// 🎨 SVG ICONS
// ==========================================
const SVG = {
  trigger: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  message: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  media: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  buttons: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  ),
  condition: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 21V9a9 9 0 0 0 9 9" />
    </svg>
  ),
  delay: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 16 14" />
    </svg>
  ),
  gallery: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  delete: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  template: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
};

const LevelBadgeHeader = ({ level, nextLevel }) => (
  <div style={styles.levelBadgeContainer}>
    <span style={styles.levelBadgeCurrent}>📍 L: {level || "ANY"}</span>
    <span style={styles.levelBadgeNext}>➔ {nextLevel || "ANY"}</span>
  </div>
);

const NodeCard = ({ title, icon, color, selected, children, onDelete, level, nextLevel }) => (
  <div style={{ ...styles.nodeCard, borderColor: selected ? color : "#e2e8f0" }}>
    <div style={{ ...styles.nodeHeader, background: color }}>
      <div style={styles.iconContainer}>{icon}</div>
      <span style={{ fontWeight: "700", color: "#fff", fontSize: "12px", flexGrow: 1 }}>{title}</span>
      <button onClick={onDelete} style={styles.btnDeleteNode} title="Delete Node">✕</button>
    </div>
    <div style={{ padding: "10px" }}>
      <LevelBadgeHeader level={level} nextLevel={nextLevel} />
      {children}
    </div>
  </div>
);

const TriggerNode = ({ id, data, selected }) => (
  <NodeCard 
    title="Trigger (Keyword)" 
    icon={SVG.trigger} 
    color="#2563eb" 
    selected={selected} 
    onDelete={() => data.onDelete(id)}
    level={data.level}
    nextLevel={data.nextLevel}
  >
    <div style={styles.nodeBodyText}>Matches incoming keyword:</div>
    <div style={styles.badge}>{data.keyword || "e.g. hello, products"}</div>
    <Handle type="source" position={Position.Bottom} style={styles.handleBlue} />
  </NodeCard>
);

const MessageNode = ({ id, data, selected }) => (
  <NodeCard 
    title="Send Message" 
    icon={SVG.message} 
    color="#0d9488" 
    selected={selected} 
    onDelete={() => data.onDelete(id)}
    level={data.level}
    nextLevel={data.nextLevel}
  >
    <Handle type="target" position={Position.Top} style={styles.handleTeal} />
    <div style={styles.nodeBodyText}>{data.message || "Click to configure reply text..."}</div>
    <Handle type="source" position={Position.Bottom} style={styles.handleTeal} />
  </NodeCard>
);

const MediaNode = ({ id, data, selected }) => {
  const isVideo = data.mediaUrl?.match(/\.(mp4|webm|ogg)$/i);
  return (
    <NodeCard 
      title="Send Media" 
      icon={SVG.media} 
      color="#8b5cf6" 
      selected={selected} 
      onDelete={() => data.onDelete(id)}
      level={data.level}
      nextLevel={data.nextLevel}
    >
      <Handle type="target" position={Position.Top} style={styles.handlePurple} />
      
      {data.mediaUrl ? (
        <div style={{ marginBottom: "8px" }}>
          <SecureMediaWrapper 
            src={data.mediaUrl} 
            type={isVideo ? "video" : "image"} 
            style={{ width: "100%", height: "80px", borderRadius: "6px", objectFit: "cover" }} 
          />
        </div>
      ) : (
        <div style={{ padding: "10px", background: "#f1f5f9", textAlign: "center", borderRadius: "6px", color: "#64748b", fontSize: "10px", marginBottom: "8px" }}>
          No Media Attached
        </div>
      )}

      <div style={styles.nodeBodyText}><b>Caption:</b> {data.caption || "None"}</div>
      <Handle type="source" position={Position.Bottom} style={styles.handlePurple} />
    </NodeCard>
  );
};

const ButtonsNode = ({ id, data, selected }) => {
  const buttonsList = data.buttons || ["Yes", "No"];

  return (
    <NodeCard 
      title="Interactive Buttons" 
      icon={SVG.buttons} 
      color="#d97706" 
      selected={selected} 
      onDelete={() => data.onDelete(id)}
      level={data.level}
      nextLevel={data.nextLevel}
    >
      <Handle type="target" position={Position.Top} style={styles.handleAmber} />
      
      <div style={{ fontWeight: "600", fontSize: "12px", color: "#334155", marginBottom: "8px" }}>
        {data.title || "Choose Option:"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {buttonsList.map((btn, idx) => {
          const buttonLabel = typeof btn === "string" ? btn : btn.text || `Option ${idx + 1}`;
          const handleId = `btn_output_${idx}`;

          return (
            <div 
              key={idx} 
              style={{ 
                position: "relative", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between" 
              }}
            >
              <div style={{ ...styles.buttonPreview, width: "100%", margin: 0 }}>
                {buttonLabel}
              </div>

              <Handle 
                type="source" 
                position={Position.Right} 
                id={handleId} 
                style={{ 
                  background: "#d97706", 
                  width: "10px", 
                  height: "10px", 
                  right: "-15px" 
                }} 
              />
            </div>
          );
        })}
      </div>
    </NodeCard>
  );
};

const ConditionNode = ({ id, data, selected }) => (
  <NodeCard 
    title="Condition (If/Else)" 
    icon={SVG.condition} 
    color="#ef4444" 
    selected={selected} 
    onDelete={() => data.onDelete(id)}
    level={data.level}
    nextLevel={data.nextLevel}
  >
    <Handle type="target" position={Position.Top} style={styles.handleRed} />
    <div style={styles.nodeBodyText}>If message contains: <b>{data.condition || "N/A"}</b></div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", fontWeight: "700" }}>
      <span style={{ color: "#16a34a" }}>TRUE ➔</span>
      <span style={{ color: "#dc2626" }}>FALSE ➔</span>
    </div>
    <Handle type="source" id="true" position={Position.Bottom} style={{ ...styles.handleRed, left: "30%" }} />
    <Handle type="source" id="false" position={Position.Bottom} style={{ ...styles.handleRed, left: "70%" }} />
  </NodeCard>
);

const DelayNode = ({ id, data, selected }) => (
  <NodeCard 
    title="Wait Delay" 
    icon={SVG.delay} 
    color="#64748b" 
    selected={selected} 
    onDelete={() => data.onDelete(id)}
    level={data.level}
    nextLevel={data.nextLevel}
  >
    <Handle type="target" position={Position.Top} style={styles.handleGray} />
    <div style={styles.nodeBodyText}>Delay for: <b>{data.delay || 3} seconds</b></div>
    <Handle type="source" position={Position.Bottom} style={styles.handleGray} />
  </NodeCard>
);

const nodeTypes = {
  triggerNode: TriggerNode,
  messageNode: MessageNode,
  mediaNode: MediaNode,
  buttonsNode: ButtonsNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,
};

const defaultEdgeOptions = {
  animated: true,
  style: { strokeWidth: 3, stroke: "#64748b" },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
  interactionWidth: 25,
  updatable: true,
  focusable: true,
};

// ==========================================
// MAIN BOT BUILDER COMPONENT
// ==========================================
export default function BotBuilder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const flowId = searchParams.get("id");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState("Main Flow");
  const [selectedNode, setSelectedNode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userMediaGallery, setUserMediaGallery] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Quota & Plan States
  const [userPlan, setUserPlan] = useState("FREE");
  const [flowCount, setFlowCount] = useState(0);
  const [maxLimit, setMaxLimit] = useState(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3500);
  };

  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode((curr) => (curr?.id === nodeId ? null : curr));
  }, [setNodes, setEdges]);

  // Fetch User Plan and Quota from Backend
  const fetchUserQuota = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [userRes, flowsRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/auth/me`, { headers }),
        axios.get(`${API_BASE_URL}/api/bot-flows/list`, { headers }),
      ]);

      if (userRes.status === "fulfilled" && userRes.value.data) {
        const userObj = userRes.value.data.user || userRes.value.data;
        const sub = userObj?.subscription || {};
        const rawPlan = sub.planId || sub.planName || userObj.planId || userObj.plan || "price_free";
        setUserPlan(sub.planName || rawPlan);
        setMaxLimit(getFlowLimitByPlan(rawPlan));
      }

      if (flowsRes.status === "fulfilled") {
        const resFlows = flowsRes.value.data;
        const fetchedFlows = resFlows?.flows || resFlows?.data || (Array.isArray(resFlows) ? resFlows : []);
        setFlowCount(fetchedFlows.length);
      }
    } catch (err) {
      console.warn("Could not fetch plan limits from backend", err);
    }
  }, []);

  useEffect(() => {
    fetchUserQuota();
  }, [fetchUserQuota]);

  // Fetch flow by ID
  useEffect(() => {
    const fetchFlow = async () => {
      const token = localStorage.getItem("token");

      if (!flowId) {
        setFlowName("New Flow Architecture");
        setSelectedNode(null);
        setNodes([
          { 
            id: "node-1", 
            type: "triggerNode", 
            data: { keyword: "hi, hello, products", level: "ANY", nextLevel: "ANY", onDelete: deleteNode }, 
            position: { x: 250, y: 50 } 
          },
          { 
            id: "node-2", 
            type: "messageNode", 
            data: { message: "Welcome to our Support Service!", level: "ANY", nextLevel: "ANY", onDelete: deleteNode }, 
            position: { x: 250, y: 220 } 
          },
        ]);
        setEdges([{ id: "e1-2", source: "node-1", target: "node-2", ...defaultEdgeOptions }]);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/bot-flows/current?id=${flowId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.data?.flow) {
          if (res.data.flow.name) setFlowName(res.data.flow.name);

          if (res.data.flow.nodes?.length) {
            const loadedNodes = res.data.flow.nodes.map((n) => ({
              ...n,
              data: { 
                ...n.data, 
                level: n.data?.level || "ANY",
                nextLevel: n.data?.nextLevel || "ANY",
                onDelete: deleteNode 
              },
            }));
            setNodes(loadedNodes);
            setEdges(res.data.flow.edges || []);
            return;
          }
        }
      } catch (err) {
        console.warn("Error fetching flow by ID, loading fresh default canvas.");
      }
    };

    fetchFlow();
  }, [deleteNode, setNodes, setEdges, flowId]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const onReconnect = useCallback(
    (oldEdge, newConnection) => setEdges((els) => reconnectEdge(oldEdge, newConnection, els)),
    [setEdges]
  );

  const onNodeClick = (_, node) => setSelectedNode(node);

  const addNode = (type, initialData = {}) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      data: { 
        level: "ANY",
        nextLevel: "ANY",
        ...initialData, 
        onDelete: deleteNode 
      },
      position: { x: 250 + Math.random() * 80, y: 150 + Math.random() * 80 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateSelectedNodeData = (key, value) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const updatedData = { ...node.data, [key]: value };
          setSelectedNode({ ...node, data: updatedData });
          return { ...node, data: updatedData };
        }
        return node;
      })
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedNode) return;

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Auth Token missing. Please log in again.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/media/upload`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` 
        },
      });

      const fullMediaUrl = `${API_BASE_URL}${res.data.filePath}`;
      updateSelectedNodeData("mediaUrl", fullMediaUrl);
      showToast("Media file uploaded successfully!", "success");
    } catch (err) {
      console.error("Upload Error Details:", err.response?.data || err.message);
      showToast(`Upload failed: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const fetchUserMedia = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Auth Token missing.", "error");
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/media/user-gallery`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserMediaGallery(res.data.files || []);
    } catch (err) {
      console.error("Gallery fetch failed:", err);
      showToast("Failed to load user gallery.", "error");
    }
  };

  // 📋 Load Template Handler
  const handleSelectTemplate = (tpl) => {
    setFlowName(tpl.title);
    setSelectedNode(null);
    const configuredNodes = tpl.nodes.map(n => ({
      ...n,
      data: { ...n.data, onDelete: deleteNode }
    }));
    setNodes(configuredNodes);
    setEdges(tpl.edges);
    setShowTemplatesModal(false);
    showToast(`Template '${tpl.title}' loaded successfully!`, "success");
  };

  const handleSaveFlow = async () => {
    if (!flowName.trim()) {
      showToast("Please enter a valid Flow Name before saving!", "error");
      return;
    }

    if (!flowId && flowCount >= maxLimit) {
      setShowUpgradeModal(true);
      showToast("Quota Reached. Upgrade Plan to increase limits.", "error");
      return;
    }

    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      const cleanNodes = nodes.map(({ data, ...rest }) => {
        const { onDelete, ...cleanData } = data;
        return { 
          ...rest, 
          data: {
            ...cleanData,
            level: cleanData.level ? cleanData.level.trim().toUpperCase() : "ANY",
            nextLevel: cleanData.nextLevel ? cleanData.nextLevel.trim().toUpperCase() : "ANY"
          } 
        };
      });

      const res = await axios.post(`${API_BASE_URL}/api/bot-flows/save`, {
        id: flowId || undefined,
        name: flowName.trim(),
        nodes: cleanNodes,
        edges,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data?.flow?._id) {
        setSearchParams({ id: res.data.flow._id });
      }

      showToast(`Bot Flow '${flowName}' successfully saved!`, "success");
      fetchUserQuota();
    } catch (err) {
      console.error("Save error:", err);
      const status = err.response?.status;
      const isQuotaError = status === 403 || status === 400 || err.response?.data?.quotaExceeded;

      if (isQuotaError) {
        setShowUpgradeModal(true);
        showToast("Quota Reached. Upgrade Plan to increase limits.", "error");
      } else {
        showToast("Failed to save bot flow.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClearAndNewFlow = () => {
    if (flowCount >= maxLimit) {
      setShowUpgradeModal(true);
      showToast("Quota Reached. Upgrade Plan to increase limits.", "error");
      return;
    }

    setSearchParams({}, { replace: true });
    setFlowName("New Flow Architecture");
    setSelectedNode(null);

    const defaultNodes = [
      { 
        id: "node-1", 
        type: "triggerNode", 
        data: { keyword: "hi, hello", level: "ANY", nextLevel: "ANY", onDelete: deleteNode }, 
        position: { x: 250, y: 50 } 
      },
      { 
        id: "node-2", 
        type: "messageNode", 
        data: { message: "Welcome!", level: "ANY", nextLevel: "ANY", onDelete: deleteNode }, 
        position: { x: 250, y: 220 } 
      },
    ];

    setNodes(defaultNodes);
    setEdges([{ id: "e1-2", source: "node-1", target: "node-2", ...defaultEdgeOptions }]);
    showToast("Canvas reset for new flow!", "info");
  };

  return (
    <div style={styles.wrapper}>
      <ToastNotification toast={toast} onClose={() => setToast({ ...toast, show: false })} />
      <UpgradeModal 
        show={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        currentPlan={userPlan}
        flowCount={flowCount}
        maxLimit={maxLimit}
      />
      <TemplatesModal 
        show={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <div style={styles.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={styles.flowTitleInputContainer}>
            {SVG.edit}
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Flow Name e.g. Support Flow"
              style={styles.flowNameInput}
            />
          </div>

          <div style={styles.quotaBadge}>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              Plan: <strong style={{ textTransform: "uppercase", color: "#2563eb" }}>{userPlan}</strong>
            </span>
            <span style={styles.quotaPill}>
              Flows: {flowCount} / {maxLimit === Infinity ? "∞" : maxLimit}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setShowTemplatesModal(true)} style={styles.btnTemplate}>
            {SVG.template} <span>Fully Branched Templates</span>
          </button>
          <button onClick={handleClearAndNewFlow} style={styles.btnDanger}>+ New Flow / Clear</button>
          <button onClick={handleSaveFlow} disabled={saving} style={styles.btnPrimary}>
            {SVG.save}
            <span>{saving ? "Saving..." : "Save Flow Architecture"}</span>
          </button>
        </div>
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.paletteSidebar}>
          <div style={styles.sidebarSectionTitle}>Add Flow Nodes</div>
          <button onClick={() => addNode("triggerNode", { keyword: "products" })} style={styles.paletteBtn}>
            {SVG.trigger} <span>Keyword Trigger</span>
          </button>
          <button onClick={() => addNode("messageNode", { message: "Hello!" })} style={styles.paletteBtn}>
            {SVG.message} <span>Send Text Reply</span>
          </button>
          <button onClick={() => addNode("mediaNode", { mediaUrl: "", caption: "Check out this file" })} style={styles.paletteBtn}>
            {SVG.media} <span>Send Media File</span>
          </button>
          <button onClick={() => addNode("buttonsNode", { title: "Select Option", buttons: ["Yes", "No"] })} style={styles.paletteBtn}>
            {SVG.buttons} <span>Interactive Buttons</span>
          </button>
          <button onClick={() => addNode("conditionNode", { condition: "price" })} style={styles.paletteBtn}>
            {SVG.condition} <span>Logic Condition</span>
          </button>
          <button onClick={() => addNode("delayNode", { delay: 3 })} style={styles.paletteBtn}>
            {SVG.delay} <span>Simulated Delay</span>
          </button>
        </div>

        <div style={styles.canvasContainer}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onNodeClick={onNodeClick}
            deleteKeyCode={["Backspace", "Delete"]}
            edgesFocusable={true}
            edgesUpdatable={true}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
          >
            <Controls style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }} />
            <MiniMap style={{ border: "1px solid #cbd5e1", borderRadius: "8px" }} zoomable pannable />
            <Background color="#94a3b8" gap={18} size={1} />
          </ReactFlow>
        </div>

        <div style={styles.inspectorDrawer}>
          <div style={styles.sidebarSectionTitle}>Node Properties</div>
          {selectedNode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={styles.nodeMetaBadge}>ID: {selectedNode.id}</div>

              <div style={styles.levelControlBox}>
                <div>
                  <label style={styles.label}>Match Current Level:</label>
                  <input 
                    type="text" 
                    value={selectedNode.data.level || "ANY"} 
                    onChange={(e) => updateSelectedNodeData("level", e.target.value.toUpperCase())} 
                    style={styles.input} 
                    placeholder="e.g. ANY, BALANCE_MENU"
                  />
                </div>
                <div style={{ marginTop: "6px" }}>
                  <label style={styles.label}>Set Next Level (Post Response):</label>
                  <input 
                    type="text" 
                    value={selectedNode.data.nextLevel || "ANY"} 
                    onChange={(e) => updateSelectedNodeData("nextLevel", e.target.value.toUpperCase())} 
                    style={styles.input} 
                    placeholder="e.g. ANY, BALANCE_CHECK"
                  />
                </div>
              </div>

              {selectedNode.type === "triggerNode" && (
                <div>
                  <label style={styles.label}>Keywords (comma separated):</label>
                  <input type="text" value={selectedNode.data.keyword || ""} onChange={(e) => updateSelectedNodeData("keyword", e.target.value)} style={styles.input} />
                </div>
              )}

              {selectedNode.type === "messageNode" && (
                <div>
                  <label style={styles.label}>Message Text Content:</label>
                  <textarea rows={5} value={selectedNode.data.message || ""} onChange={(e) => updateSelectedNodeData("message", e.target.value)} style={styles.textarea} />
                </div>
              )}

              {selectedNode.type === "buttonsNode" && (
                <>
                  <div>
                    <label style={styles.label}>Interactive Message Body Text:</label>
                    <textarea 
                      rows={3} 
                      value={selectedNode.data.title || ""} 
                      onChange={(e) => updateSelectedNodeData("title", e.target.value)} 
                      style={styles.textarea} 
                      placeholder="e.g. Do you want to proceed?"
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Buttons (Up to 3):</label>
                    {(selectedNode.data.buttons || ["Yes", "No"]).map((btn, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                        <input
                          type="text"
                          value={typeof btn === "string" ? btn : btn.text || ""}
                          onChange={(e) => {
                            const updated = [...(selectedNode.data.buttons || ["Yes", "No"])];
                            updated[idx] = e.target.value;
                            updateSelectedNodeData("buttons", updated);
                          }}
                          style={styles.input}
                          placeholder={`Button ${idx + 1}`}
                        />
                        {selectedNode.data.buttons?.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = selectedNode.data.buttons.filter((_, i) => i !== idx);
                              updateSelectedNodeData("buttons", updated);
                            }}
                            style={{ ...styles.btnDanger, padding: "4px 8px" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    {(selectedNode.data.buttons || []).length < 3 && (
                      <button
                        onClick={() => {
                          const current = selectedNode.data.buttons || [];
                          updateSelectedNodeData("buttons", [...current, `Option ${current.length + 1}`]);
                        }}
                        style={{ ...styles.btnSecondary, marginTop: "4px" }}
                      >
                        + Add Button
                      </button>
                    )}
                  </div>
                </>
              )}

              {selectedNode.type === "mediaNode" && (
                <>
                  <div>
                    <label style={styles.label}>Upload File (Image/Video):</label>
                    <input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} style={styles.input} />
                    {uploading && <span style={{ fontSize: "11px", color: "#2563eb" }}>Uploading file...</span>}
                  </div>

                  <div>
                    <button onClick={() => { fetchUserMedia(); setShowGallery(true); }} style={styles.btnSecondary}>
                      {SVG.gallery} <span>Choose From Media Gallery</span>
                    </button>
                  </div>

                  <div>
                    <label style={styles.label}>Or Direct Media URL:</label>
                    <input type="text" value={selectedNode.data.mediaUrl || ""} onChange={(e) => updateSelectedNodeData("mediaUrl", e.target.value)} style={styles.input} placeholder="https://..." />
                  </div>

                  <div>
                    <label style={styles.label}>Caption:</label>
                    <input type="text" value={selectedNode.data.caption || ""} onChange={(e) => updateSelectedNodeData("caption", e.target.value)} style={styles.input} />
                  </div>
                </>
              )}

              {selectedNode.type === "delayNode" && (
                <div>
                  <label style={styles.label}>Delay Duration (Seconds):</label>
                  <input type="number" value={selectedNode.data.delay || 3} onChange={(e) => updateSelectedNodeData("delay", e.target.value)} style={styles.input} />
                </div>
              )}

              {selectedNode.type === "conditionNode" && (
                <div>
                  <label style={styles.label}>Matching Criteria Text:</label>
                  <input type="text" value={selectedNode.data.condition || ""} onChange={(e) => updateSelectedNodeData("condition", e.target.value)} style={styles.input} />
                </div>
              )}

              <button onClick={() => deleteNode(selectedNode.id)} style={{ ...styles.btnDanger, marginTop: "10px" }}>
                {SVG.delete} <span>Delete Selected Node</span>
              </button>
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>
              Click any node on the canvas to inspect & configure properties.
            </div>
          )}
        </div>
      </div>

      {showGallery && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBody}>
            <h4 style={{ margin: "0 0 10px 0" }}>User Uploaded Media</h4>
            <div style={styles.galleryGrid}>
              {userMediaGallery.length > 0 ? (
                userMediaGallery.map((fileUrl, i) => (
                  <div key={i} onClick={() => { updateSelectedNodeData("mediaUrl", fileUrl); setShowGallery(false); }} style={styles.galleryItem}>
                    <SecureMediaWrapper 
                      src={fileUrl} 
                      type={fileUrl.match(/\.(mp4|webm|ogg)$/i) ? "video" : "image"} 
                      style={{ width: "100%", height: "70px", objectFit: "cover" }} 
                    />
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", fontSize: "12px", gridColumn: "span 3" }}>No files uploaded yet.</div>
              )}
            </div>
            <button onClick={() => setShowGallery(false)} style={{ ...styles.btnSecondary, marginTop: "15px" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { 
    height: "calc(100vh - 120px)", 
    minHeight: "500px",
    width: "100%", 
    display: "flex", 
    flexDirection: "column", 
    background: "#f8fafc", 
    borderRadius: "12px", 
    border: "1px solid #e2e8f0", 
    overflow: "hidden", 
    fontFamily: "sans-serif",
    boxSizing: "border-box"
  },
  topBar: { 
    minHeight: "65px", 
    padding: "10px 15px", 
    background: "#ffffff", 
    borderBottom: "1px solid #e2e8f0", 
    display: "flex", 
    flexWrap: "wrap",
    justifyContent: "space-between", 
    alignItems: "center",
    gap: "10px"
  },
  flowTitleInputContainer: { display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 8px" },
  flowNameInput: { border: "none", outline: "none", background: "transparent", fontSize: "14px", fontWeight: "700", color: "#0f172a", width: "150px" },
  quotaBadge: { display: "flex", alignItems: "center", gap: "8px", borderLeft: "1px solid #cbd5e1", paddingLeft: "10px", flexWrap: "wrap" },
  quotaPill: { background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },
  
  mainLayout: { 
    flexGrow: 1, 
    display: "flex", 
    flexDirection: window.innerWidth <= 768 ? "column" : "row",
    height: "calc(100% - 65px)",
    position: "relative",
    overflow: "hidden"
  },
  
  paletteSidebar: { 
    width: window.innerWidth <= 768 ? "100%" : "220px", 
    maxHeight: window.innerWidth <= 768 ? "140px" : "none",
    background: "#ffffff", 
    borderRight: window.innerWidth <= 768 ? "none" : "1px solid #e2e8f0", 
    borderBottom: window.innerWidth <= 768 ? "1px solid #e2e8f0" : "none",
    padding: "12px", 
    display: "flex", 
    flexDirection: window.innerWidth <= 768 ? "row" : "column", 
    gap: "8px",
    overflowX: "auto",
    overflowY: window.innerWidth <= 768 ? "hidden" : "auto",
    flexShrink: 0,
    zIndex: 5
  },
  sidebarSectionTitle: { fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: window.innerWidth <= 768 ? "none" : "block" },
  
  paletteBtn: { 
    display: "flex", 
    alignItems: "center", 
    gap: "8px", 
    padding: "8px 10px", 
    background: "#f1f5f9", 
    border: "1px solid #cbd5e1", 
    borderRadius: "8px", 
    cursor: "pointer", 
    fontWeight: "600", 
    color: "#1e293b", 
    fontSize: "12px", 
    textAlign: "left",
    whiteSpace: window.innerWidth <= 768 ? "nowrap" : "normal",
    flexShrink: 0
  },
  
  canvasContainer: { flexGrow: 1, height: "100%", background: "#f1f5f9", position: "relative" },
  
  inspectorDrawer: { 
    width: window.innerWidth <= 768 ? "100%" : "280px", 
    maxHeight: window.innerWidth <= 768 ? "45%" : "none",
    background: "#ffffff", 
    borderLeft: window.innerWidth <= 768 ? "none" : "1px solid #e2e8f0", 
    borderTop: window.innerWidth <= 768 ? "1px solid #e2e8f0" : "none",
    padding: "16px", 
    overflowY: "auto",
    flexShrink: 0,
    boxShadow: window.innerWidth <= 768 ? "0 -4px 10px rgba(0,0,0,0.05)" : "none"
  },

  btnPrimary: { display: "flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  btnTemplate: { display: "flex", alignItems: "center", gap: "6px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  btnSecondary: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#1e293b", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px", width: "100%" },
  btnDanger: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  
  nodeCard: { background: "#ffffff", borderRadius: "10px", width: "200px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", border: "2px solid #e2e8f0", overflow: "hidden", fontSize: "12px" },
  nodeHeader: { padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px" },
  iconContainer: { display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", padding: "4px", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  btnDeleteNode: { background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "12px", fontWeight: "700" },
  nodeBodyText: { fontSize: "11px", color: "#475569", lineHeight: "1.4" },
  badge: { marginTop: "6px", background: "#eff6ff", color: "#1d4ed8", padding: "3px 6px", borderRadius: "4px", fontWeight: "600", display: "inline-block" },
  buttonPreview: { padding: "4px 8px", background: "#fffbebe", border: "1px solid #fde68a", color: "#b45309", borderRadius: "4px", textAlign: "center", fontSize: "10px", fontWeight: "600" },
  levelBadgeContainer: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f1f5f9", padding: "3px 6px", borderRadius: "4px", marginBottom: "8px", fontSize: "9px", fontWeight: "700" },
  levelBadgeCurrent: { color: "#2563eb" },
  levelBadgeNext: { color: "#16a34a" },
  levelControlBox: { background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "8px" },
  handleBlue: { background: "#2563eb", width: "10px", height: "10px" },
  handleTeal: { background: "#0d9488", width: "10px", height: "10px" },
  handlePurple: { background: "#8b5cf6", width: "10px", height: "10px" },
  handleAmber: { background: "#d97706", width: "10px", height: "10px" },
  handleRed: { background: "#ef4444", width: "10px", height: "10px" },
  handleGray: { background: "#64748b", width: "10px", height: "10px" },
  label: { fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" },
  input: { width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", boxSizing: "border-box", resize: "vertical" },
  nodeMetaBadge: { background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", color: "#64748b", fontWeight: "600" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "15px" },
  modalBody: { background: "#fff", padding: "20px", borderRadius: "10px", width: "100%", maxWidth: "360px", boxSizing: "border-box" },
  templateCard: { padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", transition: "all 0.2s" },
  galleryGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", maxHeight: "220px", overflowY: "auto" },
  galleryItem: { border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", overflow: "hidden" },
  planCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc" }
};