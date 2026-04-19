"""
================================================================================
  Virtual Hydraulic Turbine — Modbus TCP Server
  Phase 1: Data Generation Layer for Predictive Maintenance Dashboard
================================================================================

  Library : pymodbus 3.5.0
  Protocol: Modbus TCP
  Address : localhost:5020

  REGISTER MAP & DESCALING GUIDE FOR FRONTEND DEVELOPERS
  -------------------------------------------------------
  All Modbus Holding Registers store unsigned 16-bit integers (0–65535).
  Float values are scaled before writing. To recover the original float:

    Register 0  | Rotational Speed       | RPM      | Integer  (÷ 1)
    Register 1  | Active Power           | MW       | Int ÷ 10  → e.g. 1203 → 120.3
    Register 2  | Reactive Power         | MVAR     | Int ÷ 10
    Register 3  | Frequency              | Hz       | Int ÷ 10  → e.g. 500  → 50.0
    Register 4  | Water Flow Rate        | m³/s     | Int ÷ 10
    Register 5  | Net Head               | m        | Int ÷ 10
    Register 6  | Wicket Gate Opening    | %        | Int ÷ 10
    Register 7  | Vibration              | mm/s     | Int ÷ 100 → e.g. 325  → 3.25
    Register 8  | Shaft Run-out          | mm       | Int ÷ 100
    Register 9  | Bearing Temperature    | °C       | Int ÷ 10
    Register 10 | Air Gap                | mm       | Int ÷ 10
    Register 11 | Draft Tube Pressure    | bar      | Int ÷ 100 → e.g. 120  → 1.20
    Register 12 | Cooling Water Flow     | L/s      | Int ÷ 10
    Register 13 | Stator Winding Temp    | °C       | Int ÷ 10
    Register 14 | Governor Oil Pressure  | bar      | Int ÷ 10

================================================================================
"""

import asyncio
import logging
import math
import random
import time

from pymodbus.datastore import (
    ModbusSparseDataBlock,
    ModbusSlaveContext,
    ModbusServerContext,
)
from pymodbus.server import StartAsyncTcpServer

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("VirtualTurbine")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SERVER_HOST = "localhost"
SERVER_PORT = 5020
UPDATE_INTERVAL_SECONDS = 1.0
NUM_REGISTERS = 25          # allocate 10 spare registers beyond the 15 mapped
LOG_SAMPLE_EVERY_N = 5      # log a register snapshot every N update cycles

# ---------------------------------------------------------------------------
# Data Block Initialization
# ---------------------------------------------------------------------------
# pymodbus 3.x: the holding-register data block uses 1-based internal offsets.
# Modbus protocol address 0 maps to block offset 1, address 1 → offset 2, etc.
# Allocate keys 1 … NUM_REGISTERS so every address the harvester reads is valid.
store = ModbusSlaveContext(hr=ModbusSparseDataBlock({i: 0 for i in range(1, NUM_REGISTERS + 1)}))
server_context = ModbusServerContext(slaves=store, single=True)


# ---------------------------------------------------------------------------
# Simulation State — persisted between cycles for slow-drift parameters
# ---------------------------------------------------------------------------
class TurbineState:
    """Holds mutable state that carries over between simulation ticks."""
    bearing_temp: float = 65.0          # Reg 9  — slow drift base (°C)
    stator_temp: float = 85.0           # Reg 13 — slow drift base (°C)
    base_power: float = 120.0           # Reg 1
    base_flow: float = 85.0             # Reg 4
    base_head: float = 150.0            # Reg 5
    cycle: int = 0                      # tick counter for logging

state = TurbineState()

def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(value, hi))


# ---------------------------------------------------------------------------
# Simulation Logic
# ---------------------------------------------------------------------------
def compute_register_values() -> list[int]:
    t = time.time()
    regs = [0] * NUM_REGISTERS

    # Introduce slow macroscopic drift (period ~60 seconds)
    macro_drift = math.sin(2 * math.pi * t / 60.0)
    
    # Introduce secondary drift (period ~25 seconds)
    secondary_drift = math.cos(2 * math.pi * t / 25.0)

    # Reg 0 — Rotational Speed
    regs[0] = int(300 + 5 * macro_drift + random.randint(-2, 2))
    
    # Reg 1 — Active Power
    state.base_power += random.gauss(0, 0.2)
    state.base_power = clamp(state.base_power, 105.0, 135.0)
    active_power = state.base_power + 10 * macro_drift + random.uniform(-1.5, 1.5)
    regs[1] = int(active_power * 10)
    
    # Reg 2 — Reactive Power
    reactive_power = 15.0 + 2 * secondary_drift + random.uniform(-1.0, 1.0)
    regs[2] = int(reactive_power * 10)
    
    # Reg 3 — Frequency
    frequency = 50.0 + 0.5 * macro_drift + random.uniform(-0.1, 0.1)
    regs[3] = int(frequency * 10)
    
    # Reg 4 — Water Flow Rate
    state.base_flow += random.gauss(0, 0.1)
    state.base_flow = clamp(state.base_flow, 75.0, 95.0)
    flow_rate = state.base_flow + 5 * macro_drift + random.uniform(-1.0, 1.0)
    regs[4] = int(flow_rate * 10)
    
    # Reg 5 — Net Head
    state.base_head += random.gauss(0, 0.1)
    state.base_head = clamp(state.base_head, 140.0, 160.0)
    net_head = state.base_head + 2 * secondary_drift + random.uniform(-0.5, 0.5)
    regs[5] = int(net_head * 10)
    
    # Reg 6 — Wicket Gate Opening
    gate_opening = 80.0 + 5 * macro_drift + random.uniform(-0.5, 0.5)
    regs[6] = int(gate_opening * 10)

    # Reg 7 — Vibration
    sine_component = math.sin(2 * math.pi * 0.5 * t)
    vibration = 3.25 + 1.15 * sine_component + random.gauss(0, 0.05)
    vibration = clamp(vibration, 1.5, 4.8)
    regs[7] = int(vibration * 100)
    
    # Reg 8 — Shaft Run-out
    shaft_runout = 0.15 + 0.05 * macro_drift + random.uniform(-0.02, 0.02)
    shaft_runout = clamp(shaft_runout, 0.10, 0.25)
    regs[8] = int(shaft_runout * 100)
    
    # Reg 9 — Bearing Temperature
    state.bearing_temp += random.gauss(0, 0.1)
    state.bearing_temp = clamp(state.bearing_temp, 62.0, 68.0)
    regs[9] = int(state.bearing_temp * 10)
    
    # Reg 10 — Air Gap
    air_gap = 15.0 + 0.5 * secondary_drift + random.uniform(-0.1, 0.1)
    regs[10] = int(air_gap * 10)

    # Reg 11 — Draft Tube Pressure
    draft_pressure = 1.2 + 0.1 * macro_drift + random.uniform(-0.05, 0.05)
    regs[11] = int(draft_pressure * 100)
    
    # Reg 12 — Cooling Water Flow
    cooling_flow = 5.0 + 0.5 * secondary_drift + random.uniform(-0.2, 0.2)
    regs[12] = int(cooling_flow * 10)
    
    # Reg 13 — Stator Winding Temperature
    state.stator_temp += random.gauss(0, 0.15)
    state.stator_temp = clamp(state.stator_temp, 80.0, 95.0)
    regs[13] = int(state.stator_temp * 10)
    
    # Reg 14 — Governor Oil Pressure
    governor_pressure = 40.0 + 2 * macro_drift + random.uniform(-0.5, 0.5)
    regs[14] = int(governor_pressure * 10)

    return regs


# ---------------------------------------------------------------------------
# Background Simulation Loop
# ---------------------------------------------------------------------------
async def simulation_loop() -> None:
    log.info("Simulation loop started. Updating registers every %.1fs.", UPDATE_INTERVAL_SECONDS)

    while True:
        state.cycle += 1
        regs = compute_register_values()

        # pymodbus ModbusSlaveContext adds +1 to the address internally (zero_mode=False).
        # So setValues(3, 0, regs) → block keys 1–25, matching protocol addresses 0–24.
        store.setValues(3, 0, regs)

        if state.cycle % LOG_SAMPLE_EVERY_N == 0:
            log.info(
                "── Turbine Snapshot (cycle %d) ──────────────────────────────\n"
                "  RPM: %d  |  Power: %.1f MW  |  Freq: %.1f Hz  |  Flow: %.1f m³/s\n"
                "  Vibration: %.2f mm/s  |  Bearing Temp: %.1f °C  |  Stator Temp: %.1f °C\n"
                "  Governor Oil: %.1f bar  |  Draft Pressure: %.2f bar",
                state.cycle, regs[0], regs[1] / 10.0, regs[3] / 10.0, regs[4] / 10.0,
                regs[7] / 100.0, regs[9] / 10.0, regs[13] / 10.0, regs[14] / 10.0, regs[11] / 100.0,
            )

        await asyncio.sleep(UPDATE_INTERVAL_SECONDS)


# ---------------------------------------------------------------------------
# Server Entry Point
# ---------------------------------------------------------------------------
async def run_server() -> None:
    asyncio.create_task(simulation_loop())

    log.info("=" * 60)
    log.info("  Virtual Hydraulic Turbine — Modbus TCP Server")
    log.info("  Listening on %s:%d", SERVER_HOST, SERVER_PORT)
    log.info("=" * 60)

    await StartAsyncTcpServer(
        context=server_context,
        address=(SERVER_HOST, SERVER_PORT),
    )

if __name__ == "__main__":
    try:
        asyncio.run(run_server())
    except KeyboardInterrupt:
        log.info("Server shut down by user.")
