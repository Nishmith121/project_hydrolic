import logging
import pandas as pd
from influxdb_client import InfluxDBClient
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import joblib

INFLUX_URL = "http://localhost:8086"
INFLUX_TOKEN = "stGlbfflFYJOTzrAq6oQXRGQ6H8ez9ROn3mT8Tt_y8i4GBBwYUFT1sT3dlo5T7uxboTRjzkMM_aLyU6bczf0xg=="
INFLUX_ORG = "ruas"
INFLUX_BUCKET = "ruas"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

def main():
    logging.info("Initializing InfluxDB client...")
    client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
    query_api = client.query_api()

    # Query the last 3000 points. We use pivot to align features into columns.
    query = f'''
    from(bucket: "{INFLUX_BUCKET}")
        |> range(start: -30d)
        |> filter(fn: (r) => r["_measurement"] == "turbine_telemetry")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 3000)
    '''
    
    logging.info(f"Querying the last 3000 data points from measurement 'turbine_telemetry'...")
    df = query_api.query_data_frame(query)

    client.close()

    if isinstance(df, list):
        df = pd.concat(df, ignore_index=True)

    if df.empty:
        logging.error("No data found in InfluxDB. Please check your query and bucket configurations.")
        return

    # Physical features requested
    features = [
        'rotational_speed_rpm', 'active_power_mw', 'reactive_power_mvar', 'frequency_hz', 
        'water_flow_rate_m3s', 'net_head_m', 'wicket_gate_opening_pct', 
        'vibration_mms', 'shaft_runout_mm', 'bearing_temp_c', 
        'air_gap_mm', 'draft_tube_pressure_bar', 'cooling_water_flow_ls', 
        'stator_winding_temp_c', 'governor_oil_pressure_bar'
    ]

    # Verify that all expected features are present in the dataframe
    missing_features = [f for f in features if f not in df.columns]
    if missing_features:
        logging.warning(f"The following features are missing from the data: {missing_features}")
        # Only keep the features we actually pulled
        features = [f for f in features if f in df.columns]

    # Drop InfluxDB metadata columns and timestamp
    metadata_cols = ['result', 'table', '_start', '_stop', '_measurement', '_time']
    cols_to_drop = [c for c in metadata_cols if c in df.columns]
    
    # Filter dataset to just the physical features
    X = df[features]
    
    logging.info(f"Data extraction and cleaning complete. Training data shape: {X.shape}")

    logging.info("Fitting StandardScaler...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    logging.info("Training Isolation Forest model (contamination=0.02, random_state=42)...")
    model = IsolationForest(contamination=0.02, random_state=42)
    model.fit(X_scaled)

    # Exporting the model and scaler
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_filename = os.path.join(base_dir, 'turbine_model.joblib')
    scaler_filename = os.path.join(base_dir, 'turbine_scaler.joblib')

    joblib.dump(model, model_filename)
    joblib.dump(scaler, scaler_filename)
    
    logging.info(f"Success! Model saved to {model_filename} and scaler saved to {scaler_filename}.")

if __name__ == "__main__":
    main()
