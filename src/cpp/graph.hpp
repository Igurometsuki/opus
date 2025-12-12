#ifndef GRAPH_HPP
#define GRAPH_HPP

#include "vector.hpp"
#include <vector>
#include <cmath>

class GraphEngine {
public:
    // Fibonacci sphere distribution for evenly spacing nodes on sphere
    static std::vector<Vec3> calculateFibonacciSphere(int nodeCount, float radius) {
        std::vector<Vec3> positions;
        positions.reserve(nodeCount);
        
        const float PHI = (1.0f + std::sqrt(5.0f)) / 2.0f; // Golden ratio
        
        for (int i = 0; i < nodeCount; i++) {
            float y = 1.0f - (2.0f * i) / (nodeCount - 1.0f);
            float radiusAtY = std::sqrt(1.0f - y * y);
            
            float theta = 2.0f * M_PI * i / PHI;
            
            float x = std::cos(theta) * radiusAtY;
            float z = std::sin(theta) * radiusAtY;
            
            positions.push_back(Vec3(x * radius, y * radius, z * radius));
        }
        
        return positions;
    }
    
    // Calculate geodesic curve points along sphere surface
    static std::vector<Vec3> calculateGeodesicCurve(
        const Vec3& start, 
        const Vec3& end, 
        float radius,
        int segments
    ) {
        std::vector<Vec3> points;
        points.reserve(segments + 1);
        
        for (int i = 0; i <= segments; i++) {
            float t = static_cast<float>(i) / segments;
            
            // Linear interpolation
            Vec3 interpolated(
                start.x + (end.x - start.x) * t,
                start.y + (end.y - start.y) * t,
                start.z + (end.z - start.z) * t
            );
            
            // Project onto sphere and add slight arc
            Vec3 normalized = interpolated.normalize();
            float arcOffset = radius + std::sin(t * M_PI) * 0.8f;
            
            points.push_back(normalized.multiply(arcOffset));
        }
        
        return points;
    }
};

#endif // GRAPH_HPP
