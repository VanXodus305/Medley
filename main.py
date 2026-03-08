import json
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

with open("medicines_1000.json") as f:
    medicines = json.load(f)

with open("shops_1000.json") as f:
    shops = json.load(f)

class UserInput(BaseModel):
    message: str


def find_medicines(symptom):
    matches = []
    for med in medicines:
        if symptom.lower() in [u.lower() for u in med["uses"]]:
            matches.append(med)
    return matches


def find_shops(medicine_id):
    available_shops = []
    for shop in shops:
        for med in shop["medicines"]:
            if med["medicine_id"] == medicine_id:
                available_shops.append({
                    "shop": shop["name"],
                    "distance": shop["distance_from_user"],
                    "price": med["price"]
                })
    return available_shops


@app.post("/chat")
def chat(user_input: UserInput):
    message = user_input.message.lower()

    detected_symptoms = []
    for med in medicines:
        for use in med["uses"]:
            if use.lower() in message:
                detected_symptoms.append(use.lower())

    if not detected_symptoms:
        return {"reply": "Sorry, I couldn't understand your symptoms."}

    reply_text = "Based on your symptoms, you may consider:\n\n"

    suggested_meds = []

    for symptom in set(detected_symptoms):
        meds = find_medicines(symptom)
        for med in meds[:2]:
            reply_text += f"• {med['name']} ({med['brand']}) – Used for {', '.join(med['uses'])}\n"
            suggested_meds.append(med)

    reply_text += "\nAvailable at:\n"

    for med in suggested_meds[:2]:
        shops_available = find_shops(med["id"])
        for shop in shops_available[:1]:
            reply_text += f"• {shop['shop']} – {shop['distance']} away – ₹{shop['price']}\n"

    reply_text += "\n⚠ This is not medical advice. Please consult a doctor if symptoms persist."

    return {"reply": reply_text}   
