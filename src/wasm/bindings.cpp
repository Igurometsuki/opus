#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "../cpp/vector.hpp"
#include "../cpp/graph.hpp"

using namespace emscripten;

// Export Vec3 to JavaScript
EMSCRIPTEN_BINDINGS(vec3_module) {
    class_<Vec3>("Vec3")
        .constructor<>()
        .constructor<float, float, float>()
        .property("x", &Vec3::x)
        .property("y", &Vec3::y)
        .property("z", &Vec3::z)
        .function("add", &Vec3::add)
        .function("subtract", &Vec3::subtract)
        .function("multiply", &Vec3::multiply)
        .function("dot", &Vec3::dot)
        .function("cross", &Vec3::cross)
        .function("length", &Vec3::length)
        .function("normalize", &Vec3::normalize)
        .function("distance", &Vec3::distance);
    
    register_vector<Vec3>("VectorVec3");
}

// Export GraphEngine functions to JavaScript
EMSCRIPTEN_BINDINGS(graph_module) {
    function("calculateFibonacciSphere", &GraphEngine::calculateFibonacciSphere);
    function("calculateGeodesicCurve", &GraphEngine::calculateGeodesicCurve);
}
