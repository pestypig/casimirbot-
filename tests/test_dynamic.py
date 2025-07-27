"""
Unit tests for dynamic Casimir calculations
Tests duty cycles, Q-enhancement, and period calculations
"""
import numpy as np
import json
import requests
import time

def test_period_frequency_relation():
    """Test that T_m * f_m ≈ 1"""
    freq_ghz = 15.0  # GHz
    
    simulation_params = {
        "geometry": "bowl",
        "gap": 1.0,
        "radius": 20000,
        "sagDepth": 16,
        "material": "PEC",
        "temperature": 20,
        "moduleType": "dynamic",
        "dynamicConfig": {
            "modulationFreqGHz": freq_ghz,
            "strokeAmplitudePm": 50,
            "burstLengthUs": 10,
            "cycleLengthUs": 1000,
            "cavityQ": 1000000000
        }
    }
    
    response = requests.post("http://localhost:5000/api/simulations", 
                           json=simulation_params)
    sim_data = response.json()
    sim_id = sim_data["id"]
    
    requests.post(f"http://localhost:5000/api/simulations/{sim_id}/start")
    
    # Wait for completion
    for _ in range(30):
        response = requests.get(f"http://localhost:5000/api/simulations/{sim_id}")
        sim_result = response.json()
        if sim_result["status"] == "completed":
            break
        time.sleep(1)
    
    # Check T * f ≈ 1
    period_ps = sim_result["results"]["strokePeriodPs"]
    period_s = period_ps * 1e-12
    freq_hz = freq_ghz * 1e9
    
    product = period_s * freq_hz
    assert abs(product - 1.0) < 1e-6, f"T*f = {product}, expected ≈ 1.0"
    
    print(f"✓ Period-frequency test passed: T*f = {product:.6f}")
    return True

def test_duty_factor_bounds():
    """Test that duty factor stays between 0 and 1"""
    test_cases = [
        {"burstLengthUs": 10, "cycleLengthUs": 1000},  # 1% duty
        {"burstLengthUs": 100, "cycleLengthUs": 1000}, # 10% duty
        {"burstLengthUs": 500, "cycleLengthUs": 1000}, # 50% duty
    ]
    
    for case in test_cases:
        simulation_params = {
            "geometry": "bowl",
            "gap": 1.0,
            "radius": 20000,
            "sagDepth": 16,
            "material": "PEC",
            "temperature": 20,
            "moduleType": "dynamic",
            "dynamicConfig": {
                "modulationFreqGHz": 15,
                "strokeAmplitudePm": 50,
                "burstLengthUs": case["burstLengthUs"],
                "cycleLengthUs": case["cycleLengthUs"],
                "cavityQ": 1000000000
            }
        }
        
        response = requests.post("http://localhost:5000/api/simulations", 
                               json=simulation_params)
        sim_data = response.json()
        sim_id = sim_data["id"]
        
        requests.post(f"http://localhost:5000/api/simulations/{sim_id}/start")
        
        # Wait for completion
        for _ in range(30):
            response = requests.get(f"http://localhost:5000/api/simulations/{sim_id}")
            sim_result = response.json()
            if sim_result["status"] == "completed":
                break
            time.sleep(1)
        
        duty_factor = sim_result["results"]["dutyFactor"]
        assert 0 <= duty_factor <= 1, f"Duty factor {duty_factor} out of bounds [0,1]"
        
        expected_duty = case["burstLengthUs"] / case["cycleLengthUs"]
        assert abs(duty_factor - expected_duty) < 1e-6, f"Duty factor mismatch: {duty_factor} vs {expected_duty}"
    
    print("✓ Duty factor bounds test passed")
    return True

def test_exotic_mass_targets():
    """Test that Needle Hull preset achieves paper targets"""
    simulation_params = {
        "geometry": "bowl",
        "gap": 1.0,
        "radius": 20000,
        "sagDepth": 16,
        "material": "PEC",
        "temperature": 20,
        "moduleType": "dynamic",
        "dynamicConfig": {
            "modulationFreqGHz": 15,
            "strokeAmplitudePm": 50,
            "burstLengthUs": 10,
            "cycleLengthUs": 1000,
            "cavityQ": 1000000000
        }
    }
    
    response = requests.post("http://localhost:5000/api/simulations", 
                           json=simulation_params)
    sim_data = response.json()
    sim_id = sim_data["id"]
    
    requests.post(f"http://localhost:5000/api/simulations/{sim_id}/start")
    
    # Wait for completion
    for _ in range(30):
        response = requests.get(f"http://localhost:5000/api/simulations/{sim_id}")
        sim_result = response.json()
        if sim_result["status"] == "completed":
            break
        time.sleep(1)
    
    # Check targets from paper
    mass_per_tile = sim_result["results"]["exoticMassPerTile"]
    mass_total = sim_result["results"]["exoticMassTotalLattice"]
    power_per_tile = sim_result["results"]["averagePowerPerTile"]
    power_total = sim_result["results"]["averagePowerTotalLattice"]
    
    # Paper targets
    assert abs(mass_per_tile - 1.5) < 0.1, f"Mass per tile {mass_per_tile} kg, expected ≈1.5 kg"
    assert abs(mass_total - 2.94e9) / 2.94e9 < 0.05, f"Total mass {mass_total:.2e} kg, expected ≈2.94e9 kg"
    assert abs(power_total - 83e6) / 83e6 < 0.05, f"Total power {power_total:.2e} W, expected ≈83 MW"
    
    print(f"✓ Exotic mass targets test passed:")
    print(f"  Per tile: {mass_per_tile:.1f} kg, {power_per_tile:.3e} MW")
    print(f"  Total: {mass_total:.2e} kg, {power_total:.2e} MW")
    return True

if __name__ == "__main__":
    print("Running dynamic Casimir tests...")
    test_period_frequency_relation()
    test_duty_factor_bounds()
    test_exotic_mass_targets()
    print("All dynamic tests passed!")