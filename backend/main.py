"""
ReFood Circular Food Surplus & Recovery Network - FastAPI Backend
Bengaluru Regional Circularity Hub
"""

from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ReFood Circular Network API",
    description="Backend service for B2B food surplus recovery, recipient matching, and ESG telemetry",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Data Models -----------------

StreamType = Literal["edible", "organic", "urgent"]

class Listing(BaseModel):
    id: str
    title: str
    description: str
    stream: StreamType
    weightKg: float
    portions: int
    imageUrl: str
    temperature: str
    distance: float
    supplier: str
    location: str
    pickupSlot: str
    expiresAt: datetime
    createdAt: datetime
    allergens: List[str]
    packagingNote: str
    category: str
    auditReady: bool = True
    coldChain: bool = True

class ListingCreate(BaseModel):
    title: str
    description: str
    stream: StreamType = "edible"
    weightKg: float
    location: str
    category: str
    allergens: List[str] = []
    packagingNote: Optional[str] = ""
    temperature: Optional[str] = "Ambient"
    expiresAt: Optional[datetime] = None

class Supplier(BaseModel):
    id: str
    name: str
    logo: str
    verified: bool
    rating: float
    totalTransfers: int
    totalKgDonated: float
    partnerSince: str
    coordinator: str
    coordinatorRole: str
    coordinatorPhone: str
    haccp: str

class Recipient(BaseModel):
    id: str
    name: str
    type: str
    kgDelivered: float
    meals: int
    progressPct: float

class Reservation(BaseModel):
    id: str
    listingId: str
    status: Literal["reserved", "ready", "in-transit", "completed"]
    step: int
    otpPin: str
    otp: str
    targetHandover: str
    pickupAddress: str
    driverName: str
    driverVehicle: str
    driverInitials: str

class Pickup(BaseModel):
    id: str
    time: str
    recipient: str
    allocationKg: float
    driverName: str
    driverInitials: str
    driverVehicle: str
    driverPhone: str
    otp: str

class MonthlyData(BaseModel):
    month: str
    shelter: float
    biogas: float

class ImpactMetrics(BaseModel):
    period: str
    totalRescuedKg: float
    co2PreventedT: float
    organicProcessedKg: float
    coordinationIndex: float
    monthlyData: List[MonthlyData]

class ChatMessage(BaseModel):
    id: str
    sender: str
    text: str
    timestamp: str
    isMine: bool

class ChatMessageCreate(BaseModel):
    sender: str = "Hotel Grand Royale (Dispatch)"
    text: str

# ----------------- In-Memory Mock Database -----------------

db_supplier = Supplier(
    id="SUP-001",
    name="Hotel Grand Royale",
    logo="HG",
    verified=True,
    rating=4.95,
    totalTransfers=148,
    totalKgDonated=3420.0,
    partnerSince="March 2023",
    coordinator="Chef Anita Sharma",
    coordinatorRole="Executive Sous Chef & Dispatch Lead",
    coordinatorPhone="+91 98450 12847",
    haccp="HACCP-KA-2024-8841"
)

db_listings: List[Listing] = [
    Listing(
        id="RF-84920",
        title="Artisanal Bakery & Breakfast Surplus",
        description="Freshly baked multigrain loaves, croissants, and breakfast rolls from morning buffet service. Chilled at 3.2°C in sanitary gastronorm crates.",
        stream="edible",
        weightKg=45.0,
        portions=112,
        imageUrl="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop",
        temperature="3.2°C Chilled",
        distance=1.4,
        supplier="Hotel Grand Royale",
        location="Koramangala, Bengaluru",
        pickupSlot="Today 14:00 - 17:30",
        expiresAt=datetime.now(),
        createdAt=datetime.now(),
        allergens=["Gluten", "Dairy / Butter", "Vegetarian Safe"],
        packagingNote="Packed in food-grade GN insulated bins. Please bring clean crates.",
        category="Bakery & Pastries",
        auditReady=True,
        coldChain=True
    ),
    Listing(
        id="RF-84921",
        title="Pre-Packed Banquet Rice & Dal Trays",
        description="Vacuum-sealed steamed basmati rice with tempered tadka dal from corporate luncheon. Maintained under strict steam-table temp control prior to chill.",
        stream="edible",
        weightKg=68.0,
        portions=170,
        imageUrl="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&h=400&fit=crop",
        temperature="4.0°C Chilled",
        distance=2.8,
        supplier="Hotel Grand Royale",
        location="Indiranagar, Bengaluru",
        pickupSlot="Today 15:30 - 18:00",
        expiresAt=datetime.now(),
        createdAt=datetime.now(),
        allergens=["Vegetarian Safe"],
        packagingNote="In sealed aluminum catering trays with tamper labels.",
        category="Catering / Prepared Meals",
        auditReady=True,
        coldChain=True
    ),
    Listing(
        id="RF-84922",
        title="Spent Coffee Grounds & Fruit Peels",
        description="Dry espresso grounds, morning citrus rinds, and pineapple skins. Ideal for commercial composting or mushroom cultivation substrates.",
        stream="organic",
        weightKg=120.0,
        portions=0,
        imageUrl="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=400&fit=crop",
        temperature="Ambient Dry",
        distance=3.5,
        supplier="Hotel Grand Royale",
        location="Koramangala, Bengaluru",
        pickupSlot="Today until 20:00",
        expiresAt=datetime.now(),
        createdAt=datetime.now(),
        allergens=[],
        packagingNote="Stored in heavy-duty 40kg biodegradable burlap sacks.",
        category="Biogas & Animal Feed",
        auditReady=True,
        coldChain=False
    ),
]

db_pickups: List[Pickup] = [
    Pickup(
        id="PK-01",
        time="17:45 IST",
        recipient="Robin Hood Army Bengaluru",
        allocationKg=45.0,
        driverName="Ramesh Kumar",
        driverInitials="RK",
        driverVehicle="Electric Van (KA 01 EK 4920)",
        driverPhone="+91 98450 99281",
        otp="749218"
    ),
    Pickup(
        id="PK-02",
        time="19:15 IST",
        recipient="Hasiru Dala Bio-Conversion",
        allocationKg=120.0,
        driverName="Suresh Gowda",
        driverInitials="SG",
        driverVehicle="Pickup Truck (KA 05 MN 1102)",
        driverPhone="+91 94480 33104",
        otp="382190"
    ),
]

db_reservation = Reservation(
    id="RF-84920",
    listingId="RF-84920",
    status="ready",
    step=2,
    otpPin="749 – 218",
    otp="749218",
    targetHandover="17:45 Local",
    pickupAddress="Grand Royale Kitchen Dock 3, Outer Ring Rd, Koramangala, Bengaluru",
    driverName="Ramesh Kumar",
    driverVehicle="Electric Van (KA 01 EK 4920)",
    driverInitials="RK"
)

db_recipients: List[Recipient] = [
    Recipient(
        id="rec-1",
        name="Robin Hood Army Bengaluru",
        type="Night Shelter & Slum Feeding",
        kgDelivered=1820.0,
        meals=4550,
        progressPct=78.0
    ),
    Recipient(
        id="rec-2",
        name="Hasiru Dala Bio-Conversion",
        type="Decentralized Biomethanation",
        kgDelivered=980.0,
        meals=0,
        progressPct=62.0
    ),
    Recipient(
        id="rec-3",
        name="Akshaya Patra Community Hub",
        type="Child Nutrition & Day Care",
        kgDelivered=620.0,
        meals=1550,
        progressPct=45.0
    ),
]

db_chat_messages: List[ChatMessage] = [
    ChatMessage(
        id="msg-1",
        sender="System",
        text="Order #RF-84920 confirmed. Dispatch channel opened between Hotel Grand Royale & Robin Hood Army driver.",
        timestamp="16:30",
        isMine=False
    ),
    ChatMessage(
        id="msg-2",
        sender="Driver (Ramesh Kumar)",
        text="Namaskara Chef! Van is departing Ejipura depot now. Current ETA to Gate 3 loading dock is ~17:35 IST.",
        timestamp="16:42",
        isMine=False
    ),
    ChatMessage(
        id="msg-3",
        sender="Hotel Grand Royale (Dispatch)",
        text="All 3 GN crates are loaded with thermal tamper tags and staged at Dock 3 refrigeration hold. Security has your gate pass PIN.",
        timestamp="16:45",
        isMine=True
    ),
]

# ----------------- API Routes -----------------

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "ReFood Circular Surplus Recovery API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/listings", response_model=List[Listing])
def get_listings(
    stream: Optional[str] = None,
    max_distance: Optional[float] = None
):
    results = db_listings
    if stream and stream != "all":
        results = [l for l in results if l.stream == stream]
    if max_distance:
        results = [l for l in results if l.distance <= max_distance]
    return results

@app.get("/api/listings/{listing_id}", response_model=Listing)
def get_listing(listing_id: str):
    for l in db_listings:
        if l.id == listing_id:
            return l
    raise HTTPException(status_code=404, detail="Listing not found")

@app.post("/api/listings", response_model=Listing)
def create_listing(payload: ListingCreate):
    new_id = f"RF-{int(datetime.now().timestamp())}"
    new_item = Listing(
        id=new_id,
        title=payload.title,
        description=payload.description,
        stream=payload.stream,
        weightKg=payload.weightKg,
        portions=int(payload.weightKg * 2.5),
        imageUrl="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop",
        temperature=payload.temperature or "Ambient",
        distance=0.1,
        supplier=db_supplier.name,
        location=payload.location or "Koramangala, Bengaluru",
        pickupSlot="Today",
        expiresAt=payload.expiresAt or datetime.now(),
        createdAt=datetime.now(),
        allergens=payload.allergens,
        packagingNote=payload.packagingNote or "",
        category=payload.category,
        auditReady=True,
        coldChain=payload.stream == "edible"
    )
    db_listings.insert(0, new_item)
    return new_item

@app.get("/api/supplier", response_model=Supplier)
def get_supplier():
    return db_supplier

@app.get("/api/pickups/today", response_model=List[Pickup])
def get_today_pickups():
    return db_pickups

@app.get("/api/reservations/{res_id}", response_model=Reservation)
def get_reservation(res_id: str):
    if res_id == db_reservation.id or res_id == "RF-84920":
        return db_reservation
    raise HTTPException(status_code=404, detail="Reservation not found")

@app.post("/api/reservations", response_model=Reservation)
def create_reservation(listing_id: str = Query(...)):
    return Reservation(
        id=listing_id,
        listingId=listing_id,
        status="ready",
        step=2,
        otpPin="749 – 218",
        otp="749218",
        targetHandover="17:45 Local",
        pickupAddress=db_reservation.pickupAddress,
        driverName="Ramesh Kumar",
        driverVehicle="Electric Van (KA 01 EK 4920)",
        driverInitials="RK"
    )

@app.get("/api/recipients", response_model=List[Recipient])
def get_recipients():
    return db_recipients

@app.get("/api/chat/{reservation_id}", response_model=List[ChatMessage])
def get_chat(reservation_id: str):
    return db_chat_messages

@app.post("/api/chat/{reservation_id}", response_model=ChatMessage)
def post_chat_message(reservation_id: str, payload: ChatMessageCreate):
    new_msg = ChatMessage(
        id=f"msg-{len(db_chat_messages) + 1}",
        sender=payload.sender,
        text=payload.text,
        timestamp=datetime.now().strftime("%H:%M"),
        isMine=True
    )
    db_chat_messages.append(new_msg)
    return new_msg

@app.get("/api/analytics", response_model=ImpactMetrics)
def get_analytics(period: str = Query(default="30d")):
    monthly = [
        MonthlyData(month="Apr", shelter=820, biogas=310),
        MonthlyData(month="May", shelter=940, biogas=390),
        MonthlyData(month="Jun", shelter=1100, biogas=450),
        MonthlyData(month="Jul", shelter=1020, biogas=420),
        MonthlyData(month="Aug", shelter=1280, biogas=510),
        MonthlyData(month="Sep", shelter=1390, biogas=580),
    ]

    if period == "lifetime":
        return ImpactMetrics(
            period="lifetime",
            totalRescuedKg=14200.0,
            co2PreventedT=35.5,
            organicProcessedKg=5800.0,
            coordinationIndex=99.1,
            monthlyData=monthly
        )
    elif period == "ytd":
        return ImpactMetrics(
            period="ytd",
            totalRescuedKg=9450.0,
            co2PreventedT=23.6,
            organicProcessedKg=3800.0,
            coordinationIndex=98.8,
            monthlyData=monthly
        )
    elif period == "q3":
        return ImpactMetrics(
            period="q3",
            totalRescuedKg=4850.0,
            co2PreventedT=12.4,
            organicProcessedKg=1920.0,
            coordinationIndex=98.5,
            monthlyData=monthly
        )
    else:
        return ImpactMetrics(
            period="30d",
            totalRescuedKg=3420.0,
            co2PreventedT=8.5,
            organicProcessedKg=1280.0,
            coordinationIndex=98.4,
            monthlyData=monthly
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
