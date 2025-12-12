open_engine.js:
	emcc src/wasm/bindings.cpp      \
		-O3                         \
		--bind                      \
		-s WASM=1                   \
		-s ALLOW_MEMORY_GROWTH=1    \
		-s MODULARIZE=1             \
		-s EXPORT_NAME="OpusEngine" \
		-I src/cpp                  \
		-o build/opus_engine.js

clean:
	rm build/opus_engine.js
