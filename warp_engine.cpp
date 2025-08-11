//===================================================================
//  Needle‑Hull Mk‑1  ·  Natário Warp‑Bubble Visualiser (WebAssembly)
//  ---------------------------------------------------------------
//  Single‑file build:  emcc warp_engine.cpp -O3 -s WASM=1 -std=c++17 \
//                      -s USE_GLFW=3 -s FULL_ES3=1 -o warp.js
//  ---------------------------------------------------------------
//  This file grafts the core pieces taken from the original
//  *CPU-geodesic.cpp*, *geodesic.comp* and *ray_tracing.cpp* into a
//  browser‑ready engine that receives **live** parameters from the
//  CasimirBot dashboard (the right‑hand "Physics Parameters" card)
//  and paints the corresponding Natário warp bubble in real time.
//===================================================================

#include <emscripten/emscripten.h>
#include <emscripten/html5.h>
#include <emscripten/bind.h>
#include <GLES3/gl3.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <vector>
#include <iostream>
#include <cmath>
#include <chrono>

using namespace glm;
using Clock = std::chrono::high_resolution_clock;
// ---------------------------------------------------------------
//  CONSTANTS & GLOBALS
// ---------------------------------------------------------------
constexpr double c0 = 299792458.0;          // speed of light (m/s)
constexpr double G  = 6.67430e-11;          // grav. constant (SI)

struct WarpUniforms {
    float dutyCycle;     // Ui: 0.14  (Hover)
    float g_y;           // Ui: 26.0  geometric amplification
    float cavityQ;       // Ui: 1e9   electromagnetic Q‑factor
    float sagDepth_nm;   // Ui: 16.0  nm   bow‑shallow depth
    float tsRatio;       // Ui: 4102.74 time‑scale separation
    float powerAvg_MW;   // Ui: 83.3  average power (MW)
    float exoticMass_kg; // Ui: 1.405×10³ exotic kg
};
static WarpUniforms gWarp;                // updated from JS each frame
static GLuint       gUBO = 0;            // UBO bound at binding‑point 0

//---------------------------------------------------------------
//  NATÁRIO ZERO‑EXPANSION METRIC HELPERS
//---------------------------------------------------------------
//  In Natário coordinates the line element is:
//      ds² = -dt² + (δ_ij + β_i β_j) dx^i dx^j + 2 β_i dx^i dt
//  where β is the *shift* (bubble velocity field).
//---------------------------------------------------------------

inline vec3 betaField(const vec3 &x)
{
    // ---- An illustrative shift vector tied directly to live UI ----
    // β(r)  =  β₀ · (r / R) · exp(‑(r/R)²)
    // β₀    =  dutyCycle * g_y              (dimensionless)
    // R      is keyed to sagDepth (nm ⇒ m)

    float R = gWarp.sagDepth_nm * 1e‑9f;               // sag depth → metres
    float r = length(x);
    if(r < 1e‑9f) return vec3(0.0f);

    float beta0 = gWarp.dutyCycle * gWarp.g_y;
    float prof  = (r / R) * exp(‑(r*r) / (R*R));
    return beta0 * prof * (x / r);                      // radial & C∞ smooth
}

//---------------------------------------------------------------
//  CAMERA (little trimmed version of the original)
//---------------------------------------------------------------
struct Camera {
    vec3 pos  = vec3(0, 0, 8e‑9f);   // start *inside* the bubble (nm scale)
    vec3 tgt  = vec3(0);
    float fov = 60.f;
    mat4 view()  const {return lookAt(pos, tgt, vec3(0,1,0));}
    mat4 proj(float aspect) const {return perspective(radians(fov), aspect, 1e‑12f, 1e‑4f);}    // nm clip‑planes
} gCam;

//---------------------------------------------------------------
//  GLSL SHADERS (minimal – "compute" replaced by full‑screen quad)
//---------------------------------------------------------------
static const char *kVert = R"GLSL(
#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUV;
void main(){
    vUV = aPos*0.5 + 0.5;
    gl_Position = vec4(aPos,0,1);
})GLSL";

static const char *kFrag = R"GLSL(
#version 300 es
precision highp float;
uniform WarpUniforms {              // must match C++ layout
    float dutyCycle,g_y,cavityQ,sagDepth_nm,tsRatio,powerAvg_MW,exoticMass_kg;
};

in  vec2 vUV;
out vec4 frag;

// quick inline β‑field identical to C++ for visual cohesion
vec3 betaField(vec3 x){
    float R = sagDepth_nm*1e‑9;               // m
    float r = length(x);
    if(r<1e‑9) return vec3(0.);
    float beta0 = dutyCycle*g_y;
    float prof  = (r/R)*exp(‑(r*r)/(R*R));
    return beta0*prof*(x/r);
}

void main(){
    // simple colour‑by‑β magnitude (proof‑of‑life)
    vec3 p = vec3((vUV‑0.5)*2.0,0.0);
    float b = length(betaField(p));
    frag = vec4(vec3(b),1.0);
})GLSL";

//---------------------------------------------------------------
//  OPENGL helpers
//---------------------------------------------------------------
static GLuint compileShader(GLenum type,const char*src){
    GLuint s = glCreateShader(type);
    glShaderSource(s,1,&src,nullptr);
    glCompileShader(s);
    return s;
}
static GLuint createProgram(){
    GLuint v = compileShader(GL_VERTEX_SHADER,kVert);
    GLuint f = compileShader(GL_FRAGMENT_SHADER,kFrag);
    GLuint p = glCreateProgram(); glAttachShader(p,v); glAttachShader(p,f);
    glLinkProgram(p); glDeleteShader(v); glDeleteShader(f); return p;
}

//---------------------------------------------------------------
//  GLFW / GL initialisation (WebGL via Emscripten)
//---------------------------------------------------------------
static GLFWwindow* initGL(int W,int H){
    if(!glfwInit()) return nullptr;
    glfwWindowHint(GLFW_CLIENT_API,GLFW_OPENGL_ES_API);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR,3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR,0);
    GLFWwindow* win = glfwCreateWindow(W,H,"Warp",nullptr,nullptr);
    glfwMakeContextCurrent(win);
    return win;
}

//---------------------------------------------------------------
//  UNITY QUAD (NDC)
//---------------------------------------------------------------
static GLuint gVAO=0;
void initQuad(){
    float v[12]={‑1,-1, 1,-1, 1, 1,  ‑1,-1, 1, 1, ‑1, 1};
    GLuint vbo; glGenVertexArrays(1,&gVAO); glGenBuffers(1,&vbo);
    glBindVertexArray(gVAO);
    glBindBuffer(GL_ARRAY_BUFFER,vbo);
    glBufferData(GL_ARRAY_BUFFER,sizeof(v),v,GL_STATIC_DRAW);
    glVertexAttribPointer(0,2,GL_FLOAT,GL_FALSE,0,(void*)0);
    glEnableVertexAttribArray(0);
}

//---------------------------------------------------------------
//  UBO update every frame
//---------------------------------------------------------------
void syncUBO(){
    glBindBuffer(GL_UNIFORM_BUFFER,gUBO);
    glBufferSubData(GL_UNIFORM_BUFFER,0,sizeof(WarpUniforms),&gWarp);
}

//---------------------------------------------------------------
//  JS ↔ C++ BRIDGE  (called from React store via postMessage)
//---------------------------------------------------------------
extern "C" EMSCRIPTEN_KEEPALIVE
void updateWarpUniforms(float duty,float gy,float q,float sag,float ts,float pwr,float mass){
    gWarp = {duty,gy,q,sag,ts,pwr,mass};
}
EMSCRIPTEN_BINDINGS(my_module){
    emscripten::function("updateWarpUniforms",&updateWarpUniforms);
}

//---------------------------------------------------------------
//  MAIN RENDER LOOP
//---------------------------------------------------------------
static GLFWwindow *gWin=nullptr;
static GLuint      gProg=0;
static int         gW=800,gH=600;

void frame(){
    glfwPollEvents();
    glViewport(0,0,gW,gH);
    glClearColor(0,0,0,1); glClear(GL_COLOR_BUFFER_BIT);

    syncUBO();
    glUseProgram(gProg);
    glBindVertexArray(gVAO);
    glDrawArrays(GL_TRIANGLES,0,6);

    glfwSwapBuffers(gWin);
}

int main(){
    gWin = initGL(gW,gH);
    gProg= createProgram();
    initQuad();

    // --- allocate UBO & bind to both GL & GLSL layout(index=0) ---
    glGenBuffers(1,&gUBO);
    glBindBuffer(GL_UNIFORM_BUFFER,gUBO);
    glBufferData(GL_UNIFORM_BUFFER,sizeof(WarpUniforms),nullptr,GL_DYNAMIC_DRAW);
    GLuint block = glGetUniformBlockIndex(gProg,"WarpUniforms");
    glUniformBlockBinding(gProg,block,0);    // both sides point @ 0
    glBindBufferBase(GL_UNIFORM_BUFFER,0,gUBO);

    // animation callback (browser drives at vsync)
    emscripten_set_main_loop(frame,0,1);
    return 0;
}
