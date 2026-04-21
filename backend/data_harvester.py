"""
================================================================================
  Virtual Hydraulic Turbine — Phase 2: Data Harvester
  Modbus TCP Client  →  InfluxDB v2 Writer
================================================================================

  This script is the bridge between the Phase 1 Modbus TCP server (localhost:5020)
  and InfluxDB. It runs a 1-second polling loop, reads all 15 turbine telemetry
  registers, descales the raw integer values back into physical units, and writes
  a single structured data point to InfluxDB for every cycle.

  Prerequisites:
    pip install pymodbus influxdb-client

  Usage:
    1. Fill in your InfluxDB credentials in the CONFIG block below.
    2. Make sure the Phase 1 Modbus server (modbus_server.py) is running.
    3. Run: python data_harvester.py

  ── Register Map & Descaling Reference ────────────────────────────────────────
  Reg  | Field Name               | Unit  | Descale Op
  ─────┼──────────────────────────┼───────┼───────────
   0   | rotational_speed_rpm     | RPM   | ÷ 1  (raw integer)
   1   | active_power_mw          | MW    | ÷ 10
   2   | reactive_power_mvar      | MVAR  | ÷ 10
   3   | frequency_hz             | Hz    | ÷ 10
   4   | water_flow_rate_m3s      | m³/s  | ÷ 10
   5   | net_head_m               | m     | ÷ 10
   6   | wicket_gate_opening_pct  | %     | ÷ 10
   7   | vibration_mms            | mm/s  | ÷ 100
   8   | shaft_runout_mm          | mm    | ÷ 100
   9   | bearing_temp_c           | °C    | ÷ 10
  10   | air_gap_mm               | mm    | ÷ 10
  11   | draft_tube_pressure_bar  | bar   | ÷ 100
  12   | cooling_water_flow_ls    | L/s   | ÷ 10
  13   | stator_winding_temp_c    | °C    | ÷ 10
  14   | governor_oil_pressure_bar| bar   | ÷ 10
================================================================================
"""

import logging
import time

from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ModbusException

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

# ---------------------------------------------------------------------------
# CONFIG — drop your credentials here
# ---------------------------------------------------------------------------
MODBUS_HOST = "localhost"
MODBUS_PORT = 5020
MODBUS_DEVICE_ID = 0            # Modbus unit/device ID (matches server single=True default)
MODBUS_REGISTER_START = 0       # pymodbus 3.13 uses 1-based protocol addressing
MODBUS_REGISTER_COUNT = 15      # we need registers 0–14 (15 total)

INFLUX_URL    = "http://localhost:8086"          # e.g. "http://localhost:8086"
INFLUX_TOKEN  = "stGlbfflFYJOTzrAq6oQXRGQ6H8ez9ROn3mT8Tt_y8i4GBBwYUFT1sT3dlo5T7uxboTRjzkMM_aLyU6bczf0xg=="   # InfluxDB v2 API token
INFLUX_ORG    = "ruas"                  # your InfluxDB organisation
INFLUX_BUCKET = "ruas"                   # destination bucket

POLL_INTERVAL_SECONDS = 1.0
MEASUREMENT_NAME      = "turbine_telemetry"
TURBINE_TAG           = "turbine_01"
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("DataHarvester")


# ---------------------------------------------------------------------------
# Descaling
# ---------------------------------------------------------------------------
def descale(raw_registers: list[int]) -> dict[str, float]:
    """
    Convert raw Modbus integer registers back into physical-unit floats.

    The Phase 1 server multiplied floats by a scale factor before storing
    them as integers. This function reverses that process.

    Args:
        raw_registers: List of 15 raw integer values read from the Modbus server.

    Returns:
        A dictionary mapping human-readable field names to descaled float values.
    """
    if len(raw_registers) < 15:
        raise ValueError(
            f"Expected at least 15 registers, received {len(raw_registers)}."
        )

    return {
        # ── Operational Data ──────────────────────────────────────────────
        # Reg 0: Rotational Speed — already an integer, no scaling
        "rotational_speed_rpm":      float(raw_registers[0]),
        # Reg 1–6: Scaled ×10 on the server → divide by 10 here
        "active_power_mw":           raw_registers[1]  / 10.0,
        "reactive_power_mvar":       raw_registers[2]  / 10.0,
        "frequency_hz":              raw_registers[3]  / 10.0,
        "water_flow_rate_m3s":       raw_registers[4]  / 10.0,
        "net_head_m":                raw_registers[5]  / 10.0,
        "wicket_gate_opening_pct":   raw_registers[6]  / 10.0,

        # ── Condition Monitoring Data ─────────────────────────────────────
        # Reg 7–8: Scaled ×100 → divide by 100
        "vibration_mms":             raw_registers[7]  / 100.0,
        "shaft_runout_mm":           raw_registers[8]  / 100.0,
        # Reg 9–10: Scaled ×10 → divide by 10
        "bearing_temp_c":            raw_registers[9]  / 10.0,
        "air_gap_mm":                raw_registers[10] / 10.0,

        # ── Auxiliary Systems Data ────────────────────────────────────────
        # Reg 11: Scaled ×100 → divide by 100
        "draft_tube_pressure_bar":   raw_registers[11] / 100.0,
        # Reg 12–14: Scaled ×10 → divide by 10
        "cooling_water_flow_ls":     raw_registers[12] / 10.0,
        "stator_winding_temp_c":     raw_registers[13] / 10.0,
        "governor_oil_pressure_bar": raw_registers[14] / 10.0,
    }


# ---------------------------------------------------------------------------
# InfluxDB Point Builder
# ---------------------------------------------------------------------------
def build_influx_point(telemetry: dict[str, float]) -> Point:
    """
    Package all 15 descaled fields into a single InfluxDB Point.

    Measurement : turbine_telemetry
    Tag         : unit = turbine_01
    Fields      : all 15 descaled telemetry values
    Timestamp   : current UTC time (nanosecond precision)
    """
    point = (
        Point(MEASUREMENT_NAME)
        .tag("unit", TURBINE_TAG)
        .time(time.time_ns(), WritePrecision.NS)
    )
    for field_name, value in telemetry.items():
        point = point.field(field_name, value)
    return point


# ---------------------------------------------------------------------------
# Main Harvest Loop
# ---------------------------------------------------------------------------
def run_harvester() -> None:
    """
    Main execution function.

    Connects to the Modbus TCP server and InfluxDB, then enters an infinite
    polling loop that:
      1. Reads 15 Holding Registers from the Modbus server.
      2. Descales the raw integers into physical-unit floats.
      3. Packages the data as an InfluxDB Point.
      4. Writes the Point to InfluxDB synchronously.
      5. Sleeps for POLL_INTERVAL_SECONDS before the next cycle.

    On Modbus connection errors, the loop continues and retries next cycle.
    On InfluxDB write errors, the error is logged and the loop continues.
    """
    log.info("=" * 60)
    log.info("  Virtual Hydraulic Turbine — Data Harvester  (Phase 2)")
    log.info("  Modbus source : %s:%d", MODBUS_HOST, MODBUS_PORT)
    log.info("  InfluxDB url  : %s  |  Bucket: %s", INFLUX_URL, INFLUX_BUCKET)
    log.info("  Poll interval : %.1fs", POLL_INTERVAL_SECONDS)
    log.info("=" * 60)

    # -- InfluxDB client (long-lived, reused across all write cycles) ------
    influx_client = InfluxDBClient(
        url=INFLUX_URL,
        token=INFLUX_TOKEN,
        org=INFLUX_ORG,
    )
    # SYNCHRONOUS write mode: write_api.write() blocks until the write completes
    # (or raises), making error handling straightforward for a polling loop.
    write_api = influx_client.write_api(write_options=SYNCHRONOUS)

    # -- Modbus client (long-lived, persistent TCP connection) -------------
    modbus_client = ModbusTcpClient(
        host=MODBUS_HOST,
        port=MODBUS_PORT,
    )

    cycle = 0

    try:
        while True:
            cycle_start = time.monotonic()
            cycle += 1

            # ── Step 1: Ensure Modbus connection is alive ─────────────────
            if not modbus_client.connected:
                log.info("Connecting to Modbus server at %s:%d ...", MODBUS_HOST, MODBUS_PORT)
                if not modbus_client.connect():
                    log.error(
                        "Failed to connect to Modbus server. Retrying in %.1fs.",
                        POLL_INTERVAL_SECONDS,
                    )
                    time.sleep(POLL_INTERVAL_SECONDS)
                    continue
                log.info("Modbus connection established.")

            # ── Step 2: Read Holding Registers ────────────────────────────
            try:
                registers = []
                for reg_addr in range(MODBUS_REGISTER_START, MODBUS_REGISTER_START + MODBUS_REGISTER_COUNT):
                    response = modbus_client.read_holding_registers(
                        address=reg_addr,
                        count=1,
                        slave=MODBUS_DEVICE_ID,
                    )
                    if response.isError():
                        log.error("Modbus Error reading address %d: %s", reg_addr, response)
                        registers.append(0)
                    else:
                        registers.append(response.registers[0])
            except Exception as exc:
                log.error("Modbus read error on cycle %d: %s", cycle, exc)
                modbus_client.close()   # force reconnect next cycle
                time.sleep(POLL_INTERVAL_SECONDS)
                continue

            raw_registers = registers
            log.debug("Cycle %d | Raw registers: %s", cycle, raw_registers)

            # ── Step 3: Descale raw integers → physical units ─────────────
            try:
                telemetry = descale(raw_registers)
            except ValueError as exc:
                log.error("Descaling error on cycle %d: %s", cycle, exc)
                time.sleep(POLL_INTERVAL_SECONDS)
                continue

            # ── Step 4: Write to InfluxDB ─────────────────────────────────
            point = build_influx_point(telemetry)
            try:
                write_api.write(bucket=INFLUX_BUCKET, org=INFLUX_ORG, record=point)
            except Exception as exc:   # catch broad InfluxDB/network errors
                log.error("InfluxDB write failed on cycle %d: %s", cycle, exc)
                time.sleep(POLL_INTERVAL_SECONDS)
                continue

            # ── Step 5: Log confirmation every cycle ──────────────────────
            log.info(
                "Cycle %d written ✓ | RPM: %.0f | Power: %.1f MW | Freq: %.1f Hz | "
                "Vibration: %.2f mm/s | Bearing: %.1f °C | Stator: %.1f °C",
                cycle,
                telemetry["rotational_speed_rpm"],
                telemetry["active_power_mw"],
                telemetry["frequency_hz"],
                telemetry["vibration_mms"],
                telemetry["bearing_temp_c"],
                telemetry["stator_winding_temp_c"],
            )

            # ── Step 6: Sleep for the remainder of the poll interval ───────
            elapsed = time.monotonic() - cycle_start
            sleep_time = max(0.0, POLL_INTERVAL_SECONDS - elapsed)
            time.sleep(sleep_time)

    except KeyboardInterrupt:
        log.info("Data Harvester stopped by user (KeyboardInterrupt).")
    finally:
        log.info("Closing connections...")
        modbus_client.close()
        write_api.close()
        influx_client.close()
        log.info("Shutdown complete.")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    run_harvester()
