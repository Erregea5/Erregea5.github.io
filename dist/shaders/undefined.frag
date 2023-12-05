uniform float iTime;
varying vec2 vUv;

void main()
{
    vec2 uv = vUv*2.0-1.0;
    gl_FragColor = vec4(uv,.5,1.0);
}