use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn update_turbines(current_rotations: Vec<f32>, wind_speed: f32, delta: f32) -> Vec<f32> {
    let speed_factor = wind_speed.max(0.0) * delta;

    current_rotations
        .into_iter()
        .enumerate()
        .map(|(index, value)| {
            let turbulence = 1.0 + ((index as f32 * 0.17).sin() * 0.08);
            (value + speed_factor * turbulence).rem_euclid(std::f32::consts::TAU)
        })
        .collect()
}
