"""
================================================================================
  Virtual Hydraulic Turbine — Phase 3: REST API
  FastAPI Server for InfluxDB Data Serving
================================================================================

  This script connects to the InfluxDB bucket holding our Modbus telemetry
  and exposes a clean JSON endpoint for the frontend.

  Prerequisites:
    pip install fastapi uvicorn influxdb-client

  Usage:
    1. Fill in your InfluxDB credentials in the CONFIG block below.
    2. Run this server using uvicorn:
       uvicorn fastapi_api:app --reload --port 8000
    3. The API will be available at: http://localhost:8000/api/live-data

================================================================================
"""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from influxdb_client import InfluxDBClient

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
    allow_methods=["GET"],  # We only need GET for reading live data
    allow_headers=["*"],
)

# Initialize InfluxDB Client globally so we don't recreate it on every request
influx_client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
query_api = influx_client.query_api()

@app.on_event("shutdown")
def shutdown_event():
    """Ensure we cleanly close the InfluxDB client connection on shutdown."""
    influx_client.close()
    logger.info("InfluxDB connection closed.")

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

        return cleaned_record
        
    except Exception as e:
        logger.error(f"Error communicating with InfluxDB: {e}")
        # Return a 500 Internal Server Error rather than crashing
        raise HTTPException(
            status_code=500,
            detail="Error communicating with the database. Ensure InfluxDB is running and credentials are correct."
        )

if __name__ == "__main__":
    # Provides an alternative way to run without explicitly calling uvicorn in CLI
    import uvicorn
    uvicorn.run("fastapi_api:app", host="0.0.0.0", port=8000, reload=True)
