varying vec2 v_uv;
varying float v_opacity;

void main() {
    // Pass UVs to the fragment shader
    v_uv = uv;
    
    // Keep the model opaque
    v_opacity = 1.0;

    // Standard position calculation, no displacement
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}