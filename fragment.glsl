uniform vec3 u_color;
uniform sampler2D u_map;
uniform bool u_has_map;

varying vec2 v_uv;
varying float v_opacity;

void main() {
    vec3 finalColor = u_color;
    if (u_has_map) {
        // Use the texture if it exists
        finalColor = texture2D(u_map, v_uv).rgb;
    }

    // The v_opacity is now always 1.0 from the vertex shader
    gl_FragColor = vec4(finalColor, v_opacity);
}