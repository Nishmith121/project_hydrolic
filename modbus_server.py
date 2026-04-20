"""
================================================================================
  Virtual Hydraulic Turbine — Modbus TCP Server
  Phase 1: Physics-Based Data Generation Layer for Predictive Maintenance
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
NUM_REGISTERS = 25

# ---------------------------------------------------------------------------
# Data Block Initialization
# ---------------------------------------------------------------------------
store = ModbusSlaveContext(hr=ModbusSparseDataBlock({i: 0 for i in range(1, NUM_REGISTERS + 1)}))
server_context = ModbusServerContext(slaves=store, single=True)


# ---------------------------------------------------------------------------
# Simulation State
# ---------------------------------------------------------------------------
class TurbineState:
    def __init__(self):
        self.bearing_temp = 65.0       # Base bearing temperature
        self.stator_temp = 85.0        # Base stator temperature
        self.t = 0.0                   # Global simulation time (seconds)
        self.state_idx = 0             # 0: Normal, 1: Degradation, 2: Cavitation
        self.time_in_state = 0.0

turbine = TurbineState()

def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(value, hi))

# ---------------------------------------------------------------------------
# Simulation Logic
# ---------------------------------------------------------------------------
def compute_register_values() -> list[int]:
    turbine.t += UPDATE_INTERVAL_SECONDS
    t = turbine.t

    # State Machine Logic - Rotate every 120 seconds (2 minutes)
    cycle_time = t % 360
    if cycle_time < 120:
        turbine.state_idx = 0
        turbine.time_in_state = cycle_time
        state_name = "NORMAL (Healthy)"
    elif cycle_time < 240:
        turbine.state_idx = 1
        turbine.time_in_state = cycle_time - 120
        state_name = "BEARING DEGRADATION (Slow Fault)"
    else:
        turbine.state_idx = 2
        turbine.time_in_state = cycle_time - 240
        state_name = "CAVITATION (Sudden Fault)"

    regs = [0] * NUM_REGISTERS

    # Physics: Coupling
    # Base Active Power Demand on a slow-moving sine wave (period 2 hours = 7200 sec)
    power_demand_base = 120.0 + 15.0 * math.sin(2 * math.pi * t / 7200.0)
    
    # Fault effect: Cavitation drops active power by 10%
    if turbine.state_idx == 2:
        power_demand = power_demand_base * 0.90
    else:
        power_demand = power_demand_base

    # Wicket Gate Opening tied directly to power demand
    # e.g., 120 MW ~ 80%, 135 MW ~ 90%
    gate_opening = (power_demand / 150.0) * 100.0 
    gate_opening = clamp(gate_opening, 0.0, 100.0)
    
    # Water Flow Rate tied to gate opening
    # e.g., 80% gate -> 85 m3/s
    flow_rate = gate_opening * 1.06 + random.gauss(0, 0.2)
    
    # Physics: Rotational Inertia
    rpm = 300.0 + random.gauss(0, 0.5)

    # Physics: Thermal Mass (Random Walk)
    # Drift slowly
    turbine.bearing_temp += random.gauss(0, 0.05)
    turbine.bearing_temp = clamp(turbine.bearing_temp, 50.0, 90.0)
    
    turbine.stator_temp += random.gauss(0, 0.05)
    turbine.stator_temp = clamp(turbine.stator_temp, 70.0, 110.0)

    # Fault effect: Bearing Degradation slowly adds +15C over 60s
    current_bearing_temp = turbine.bearing_temp
    vibration_amplitude = 1.15
    if turbine.state_idx == 1:
        degradation_factor = min(1.0, turbine.time_in_state / 60.0)
        current_bearing_temp += 15.0 * degradation_factor
        vibration_amplitude += 2.0 * degradation_factor

    # Physics: Harmonic Vibration
    # Base vibration + shaft rotation harmonic + noise
    rpm_freq = rpm / 60.0  # ~5 Hz
    base_vib = 3.25
    harmonic_vibration = base_vib + vibration_amplitude * math.sin(2 * math.pi * rpm_freq * t) + random.gauss(0, 0.1)

    # Fault effect: Cavitation adds high-frequency erratic noise (+5.0)
    draft_pressure = 1.20 + random.gauss(0, 0.02)
    if turbine.state_idx == 2:
        harmonic_vibration += abs(random.gauss(5.0, 1.5))
        draft_pressure += random.uniform(-0.4, 0.4)  # heavily fluctuate

    harmonic_vibration = max(0.0, harmonic_vibration)

    # Calculate remaining decoupled or slightly coupled registers
    reactive_power = power_demand * 0.12 + random.gauss(0, 0.5)
    frequency = (rpm / 300.0) * 50.0
    net_head = 150.0 - (flow_rate * 0.05) + random.gauss(0, 0.2)
    shaft_runout = 0.15 + (harmonic_vibration * 0.01) + random.gauss(0, 0.01)
    air_gap = 15.0 + random.gauss(0, 0.05)
    cooling_flow = 5.0 + random.gauss(0, 0.1)
    gov_oil_pressure = 40.0 + random.gauss(0, 0.2)

    # Log the current state for the terminal
    log.info(f"[STATE: {state_name}] t={t:.1f}s | RPM: {rpm:.1f} | Power: {power_demand:.1f} MW | Vib: {harmonic_vibration:.2f} mm/s | BrgTemp: {current_bearing_temp:.1f} °C")

    # Scale and assign to Register Map (cast to int)
    regs[0] = int(rpm)                                 # Reg 0: RPM (Int)
    regs[1] = int(power_demand * 10)                   # Reg 1: Active Power (Float x10)
    regs[2] = int(reactive_power * 10)                 # Reg 2: Reactive Power (Float x10)
    regs[3] = int(frequency * 10)                      # Reg 3: Frequency (Float x10)
    regs[4] = int(flow_rate * 10)                      # Reg 4: Water Flow Rate (Float x10)
    regs[5] = int(net_head * 10)                       # Reg 5: Net Head (Float x10)
    regs[6] = int(gate_opening * 10)                   # Reg 6: Wicket Gate Opening (Float x10)
    regs[7] = int(harmonic_vibration * 100)            # Reg 7: Vibration (Float x100)
    regs[8] = int(shaft_runout * 100)                  # Reg 8: Shaft Run-out (Float x100)
    regs[9] = int(current_bearing_temp * 10)           # Reg 9: Bearing Temperature (Float x10)
    regs[10] = int(air_gap * 10)                       # Reg 10: Air Gap (Float x10)
    regs[11] = int(draft_pressure * 100)               # Reg 11: Draft Tube Pressure (Float x100)
    regs[12] = int(cooling_flow * 10)                  # Reg 12: Cooling Water Flow (Float x10)
    regs[13] = int(turbine.stator_temp * 10)           # Reg 13: Stator Temperature (Float x10)
    regs[14] = int(gov_oil_pressure * 10)              # Reg 14: Governor Oil Pressure (Float x10)

    return regs

# ---------------------------------------------------------------------------
# Background Simulation Loop
# ---------------------------------------------------------------------------
async def simulation_loop() -> None:
    log.info("Physics Simulation loop started. Updating registers every %.1fs.", UPDATE_INTERVAL_SECONDS)

    while True:
        regs = compute_register_values()
        # pymodbus ModbusSlaveContext adds +1 to the address internally (zero_mode=False).
        # setValues(3, 0, regs) sets block keys 1-25.
        store.setValues(3, 0, regs)
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
