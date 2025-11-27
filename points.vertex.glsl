uniform float u_progress;
uniform float u_time;

varying float v_life;

// Source: https://github.com/dmnsgn/glsl-random
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec3 pos = position;
    float rand = random(pos.xy);

    // 1. Contained Explosion
    // Use smoothstep for a wider active range (fade in from 0.1 to 0.3, fade out from 0.7 to 0.9)
    float fadeIn = smoothstep(0.0, 0.1, u_progress);
    float fadeOut = smoothstep(0.99, 0.95, u_progress);
    float explosionProgress = fadeIn * fadeOut;
    vec3 randomDir = normalize(vec3(
        (rand - 0.5) * 2.0, 
        (random(pos.yx) - 0.5) * 2.0, 
        (random(pos.zy) - 0.5) * 2.0
    ));
    
    pos += randomDir * explosionProgress * 3.0;

    // 2. Add some turbulence/swirl over time
    float swirlAngle = u_time * 0.5 + rand * 10.0;
    vec3 swirl = vec3(sin(swirlAngle), cos(swirlAngle), sin(swirlAngle) * 0.5) * explosionProgress * 0.5;
    pos += swirl;

    // 3. Add gravity
    pos.y -= pow(u_progress, 2.0) * 4.0;

    // Pass life to fragment shader
    v_life = explosionProgress;

    // Point size should also peak in the middle
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (20.0 / -mvPosition.z) * explosionProgress;
    gl_Position = projectionMatrix * mvPosition;
}