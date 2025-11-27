varying float v_life;

void main() {
    // Make points circular
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    if (distanceToCenter > 0.5) {
        discard;
    }

    // Color changes over life
    vec3 color1 = vec3(1.0, 0.1, 0.1); // Bright Red
    vec3 color2 = vec3(0.8, 0.0, 0.0); // Darker Red
    vec3 finalColor = mix(color2, color1, v_life);

    // Opacity fades in and out
    float opacity = v_life;

    gl_FragColor = vec4(finalColor, opacity);
}