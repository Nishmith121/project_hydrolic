"""
================================================================================
  Virtual Hydraulic Turbine — Phase 3: REST API + SCADA Control
  FastAPI Server for InfluxDB Data Serving & Two-Way Modbus Control
================================================================================

  This script connects to the InfluxDB bucket holding our Modbus telemetry
  and exposes a clean JSON endpoint for the frontend.  It also provides a
  two-way SCADA control endpoint that writes Wicket-Gate setpoints back to
  the Modbus server.

  Prerequisites:
    pip install fastapi uvicorn influxdb-client pymodbus

  Usage:
    1. Fill in your InfluxDB credentials in the CONFIG block below.
    2. Run this server using uvicorn:
       uvicorn fastapi_api:app --reload --port 8000
    3. GET  http://localhost:8000/api/live-data    — live telemetry + ML
    4. POST http://localhost:8000/api/control-gate  — write gate setpoint

================================================================================
"""

import logging
import os
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from influxdb_client import InfluxDBClient
from pymodbus.client import AsyncModbusTcpClient

# ---------------------------------------------------------------------------
# CONFIG — drop your credentials here
# ---------------------------------------------------------------------------
INFLUX_URL    = "http://localhost:8086"
INFLUX_TOKEN  = "stGlbfflFYJOTzrAq6oQXRGQ6H8ez9ROn3mT8Tt_y8i4GBBwYUFT1sT3dlo5T7uxboTRjzkMM_aLyU6bczf0xg=="
INFLUX_ORG    = "ruas"
INFLUX_BUCKET = "ruas"
# ---------------------------------------------------------------------------

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TurbineAPI")

app = FastAPI(title="Virtual Hydraulic Turbine API")

# Configure CORS for React/Vite development environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # GET for live data, POST for SCADA control
    allow_headers=["*"],
)

# Initialize InfluxDB Client globally so we don't recreate it on every request
influx_client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
query_api = influx_client.query_api()

# Load the ML model and scaler globally
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, 'turbine_model.joblib')
scaler_path = os.path.join(base_dir, 'turbine_scaler.joblib')

ml_model = None
ml_scaler = None

try:
    if os.path.exists(model_path) and os.path.exists(scaler_path):
        ml_model = joblib.load(model_path)
        ml_scaler = joblib.load(scaler_path)
        logger.info("ML Model and Scaler loaded successfully.")
    else:
        logger.warning("ML Model or Scaler not found. Anomaly detection will be disabled.")
except Exception as e:
    logger.error(f"Failed to load ML model: {e}")

# Expected features for the ML model
ML_FEATURES = [
    'rotational_speed_rpm', 'active_power_mw', 'reactive_power_mvar', 'frequency_hz', 
    'water_flow_rate_m3s', 'net_head_m', 'wicket_gate_opening_pct', 
    'vibration_mms', 'shaft_runout_mm', 'bearing_temp_c', 
    'air_gap_mm', 'draft_tube_pressure_bar', 'cooling_water_flow_ls', 
    'stator_winding_temp_c', 'governor_oil_pressure_bar'
]

# ---------------------------------------------------------------------------
# SCADA CONTROL — Pydantic model for gate setpoint commands
# ---------------------------------------------------------------------------
class GateControl(BaseModel):
    """Payload for the Wicket Gate control endpoint."""
    gate_opening_percentage: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Desired wicket-gate opening as a percentage (0.0 – 100.0)."
    )

# ---------------------------------------------------------------------------
# MODBUS CONFIG
# ---------------------------------------------------------------------------
MODBUS_HOST = "localhost"
MODBUS_PORT = 5020
WICKET_GATE_REGISTER = 6   # Holding Register address for the Wicket Gate

@app.on_event("shutdown")
def shutdown_event():
    """Ensure we cleanly close the InfluxDB client connection on shutdown."""
    influx_client.close()
    logger.info("InfluxDB connection closed.")

def diagnose_fault(telemetry_data: dict):
    """
    Evaluates anomalous telemetry and prescribes diagnostic action.
    """
    vib = float(telemetry_data.get('vibration_mms', 0.0))
    dt_press = float(telemetry_data.get('draft_tube_pressure_bar', 0.0))
    bearing_temp = float(telemetry_data.get('bearing_temp_c', 0.0))
    rpm = float(telemetry_data.get('rotational_speed_rpm', 0.0))

    # Cavitation check
    if vib > 4.5 and (dt_press > 1.5 or dt_press < 0.8):
        return "Cavitation Detected", "CRITICAL: Reduce Wicket Gate opening immediately to stabilize pressure."
    
    # Bearing overheating check
    if bearing_temp > 75.0:
        return "Bearing Overheating / Degradation", "WARNING: Dispatch maintenance to inspect bearing lubrication and cooling oil flow."
    
    # Speed governor failure check
    if rpm > 310 or rpm < 290:
        return "Speed Governor Failure", "CRITICAL: Isolate turbine from grid. Check governor oil pressure."
    
    # Fallback
    return "Unknown Complex Anomaly", "WARNING: System operating outside healthy baseline. Monitor closely."

@app.get("/api/live-data")
async def get_live_data():
    """
    Retrieve the single most recent record for the turbine_telemetry measurement.
    """
    # Flux query: get the most recent data point from the past hour.
    # We use pivot to convert InfluxDB's row-based schema (one row per field)
    # back into a single dictionary-style row containing all fields.
    flux_query = f'''
        from(bucket: "{INFLUX_BUCKET}")
            |> range(start: -1h)
            |> filter(fn: (r) => r["_measurement"] == "turbine_telemetry")
            |> last()
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    '''
    
    try:
        # Execute query. query_api.query returns a list of tables.
        tables = query_api.query(org=INFLUX_ORG, query=flux_query)
        
        # Parse the result
        if not tables or not tables[0].records:
            return {"error": "No data found in the recent timeframe."}

        # Since we pivoted the data, all fields are in a single record dictionary
        record = tables[0].records[0].values
        
        # Clean up the output by removing internal InfluxDB metadata fields
        cleaned_record = {
            k: v for k, v in record.items()
            if not k.startswith("_") and k not in ["result", "table", "unit"]
        }
        
        # Optionally add the timestamp back if needed
        if "_time" in record:
            cleaned_record["timestamp"] = record["_time"].isoformat()

        # Generate ML Insights if the model is loaded
        if ml_model and ml_scaler:
            try:
                # Extract features in the correct order
                feature_values = []
                for f in ML_FEATURES:
                    val = cleaned_record.get(f, 0.0)
                    feature_values.append(float(val))
                
                # Reshape for sklearn
                x_input = np.array(feature_values).reshape(1, -1)
                
                # Scale and predict
                x_scaled = ml_scaler.transform(x_input)
                prediction = ml_model.predict(x_scaled)[0]
                score = ml_model.score_samples(x_scaled)[0]
                
                # 1 is normal, -1 is anomaly in IsolationForest
                is_anomaly = bool(prediction == -1)
                
                if is_anomaly:
                    diagnosis, action_required = diagnose_fault(cleaned_record)
                else:
                    diagnosis = "System Healthy"
                    action_required = "None"

                cleaned_record["ml_insights"] = {
                    "is_anomaly": is_anomaly,
                    "anomaly_score": float(score),
                    "status_message": "CRITICAL: Anomaly Detected!" if is_anomaly else "System Healthy",
                    "diagnosis": diagnosis,
                    "action_required": action_required
                }
            except Exception as ml_err:
                logger.error(f"Error during ML prediction: {ml_err}")
                cleaned_record["ml_insights"] = {"error": "Prediction failed"}

        return cleaned_record
        
    except Exception as e:
        logger.error(f"Error communicating with InfluxDB: {e}")
        # Return a 500 Internal Server Error rather than crashing
        raise HTTPException(
            status_code=500,
            detail="Error communicating with the database. Ensure InfluxDB is running and credentials are correct."
        )

# ---------------------------------------------------------------------------
# POST  /api/control-gate — Two-Way SCADA: Write Wicket-Gate Setpoint
# ---------------------------------------------------------------------------
@app.post("/api/control-gate")
async def control_gate(payload: GateControl):
    """
    Write a new Wicket Gate opening percentage to the Modbus server.

    The Modbus server stores register values as integers scaled ×10,
    so we multiply the incoming float by 10 before writing.
    """
    scaled_value = int(payload.gate_opening_percentage * 10)

    try:
        client = AsyncModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT)
        await client.connect()

        if not client.connected:
            raise ConnectionError("Unable to establish connection to Modbus server.")

        await client.write_register(address=WICKET_GATE_REGISTER, value=scaled_value)
        logger.info(
            f"SCADA WRITE ▸ Wicket gate set to {payload.gate_opening_percentage}% "
            f"(register {WICKET_GATE_REGISTER} = {scaled_value})"
        )

        client.close()

        return {
            "status": "success",
            "message": f"Wicket gate set to {payload.gate_opening_percentage}%"
        }

    except Exception as e:
        logger.error(f"Modbus write failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=(
                "Failed to communicate with the Modbus server. "
                "Ensure the SCADA simulator is running on "
                f"{MODBUS_HOST}:{MODBUS_PORT}."
            )
        )

if __name__ == "__main__":
    # Provides an alternative way to run without explicitly calling uvicorn in CLI
    import uvicorn
    uvicorn.run("fast_api:app", host="0.0.0.0", port=8000, reload=False)
