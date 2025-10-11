/**
 * @fileoverview Tetromino Shape Definitions
 * Defines all 7 standard Tetris piece shapes (I, O, T, S, Z, J, L) with their rotation states.
 * Each piece has 4 rotation states represented as 2D arrays where 1 indicates a filled block
 * and 0 indicates an empty space. Colors are assigned based on the design system.
 *
 * @module tetromino-shapes
 *
 * @example
 * // Access a tetromino shape
 * const IShape = TETROMINO_SHAPES.I;
 * console.log(IShape.color); // '#667eea'
 * console.log(IShape.rotations[0]); // First rotation state
 */

/**
 * Tetromino shape definitions
 * @constant {Object<string, Object>}
 * @property {Object} I - I-shaped tetromino (straight line)
 * @property {Object} O - O-shaped tetromino (square)
 * @property {Object} T - T-shaped tetromino
 * @property {Object} S - S-shaped tetromino
 * @property {Object} Z - Z-shaped tetromino
 * @property {Object} J - J-shaped tetromino
 * @property {Object} L - L-shaped tetromino
 */
const TETROMINO_SHAPES = {
    I: {
        color: '#667eea', // primary-blue
        rotations: [
            [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0]
            ],
            [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0]
            ]
        ]
    },
    O: {
        color: '#f5576c', // from gradient-worker
        rotations: [
            [
                [1, 1],
                [1, 1]
            ],
            [
                [1, 1],
                [1, 1]
            ],
            [
                [1, 1],
                [1, 1]
            ],
            [
                [1, 1],
                [1, 1]
            ]
        ]
    },
    T: {
        color: '#764ba2', // from gradient-lead
        rotations: [
            [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 1, 0],
                [0, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 1, 0],
                [1, 1, 0],
                [0, 1, 0]
            ]
        ]
    },
    S: {
        color: '#00f2fe', // from gradient-default
        rotations: [
            [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            [
                [0, 1, 0],
                [0, 1, 1],
                [0, 0, 1]
            ],
            [
                [0, 0, 0],
                [0, 1, 1],
                [1, 1, 0]
            ],
            [
                [1, 0, 0],
                [1, 1, 0],
                [0, 1, 0]
            ]
        ]
    },
    Z: {
        color: '#f093fb', // from gradient-worker
        rotations: [
            [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 0, 1],
                [0, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 0, 0],
                [1, 1, 0],
                [0, 1, 1]
            ],
            [
                [0, 1, 0],
                [1, 1, 0],
                [1, 0, 0]
            ]
        ]
    },
    J: {
        color: '#4facfe', // from gradient-default
        rotations: [
            [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 1, 1],
                [0, 1, 0],
                [0, 1, 0]
            ],
            [
                [0, 0, 0],
                [1, 1, 1],
                [0, 0, 1]
            ],
            [
                [0, 1, 0],
                [0, 1, 0],
                [1, 1, 0]
            ]
        ]
    },
    L: {
        color: '#333333', // text-primary
        rotations: [
            [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 1]
            ],
            [
                [0, 0, 0],
                [1, 1, 1],
                [1, 0, 0]
            ],
            [
                [1, 1, 0],
                [0, 1, 0],
                [0, 1, 0]
            ]
        ]
    }
};

// Export for use in game logic
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TETROMINO_SHAPES };
}
