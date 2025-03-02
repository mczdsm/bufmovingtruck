import Matter from 'matter-js';
import './style.css';

const engine = Matter.Engine.create();
const render = Matter.Render.create({
  element: document.getElementById('game-container'),
  engine: engine,
  options: {
    width: 800,
    height: 600,
    wireframes: false,
  },
});

// Adjust gravity to slow down boxes by 30%
engine.world.gravity.y = 0.7; // Reduced gravity

// Create the ground
const ground = Matter.Bodies.rectangle(400, 580, 810, 60, { isStatic: true, label: 'ground' });
Matter.World.add(engine.world, [ground]);

// Create the truck body
const truckBody = Matter.Bodies.rectangle(200, 500, 150, 20, {
    render: {
        fillStyle: 'brown'
    },
    label: 'truckBody'
});

// Create truck wheels (circles)
const wheelA = Matter.Bodies.circle(150, 540, 20, {
    render: {
        fillStyle: 'black'
    }
});
const wheelB = Matter.Bodies.circle(250, 540, 20, {
    render: {
        fillStyle: 'black'
    }
});

// Initial truck lip dimensions
const initialLipHeight = 40;
const increasedLipHeight = 70; // Taller lip height after level completion

// Create truck lips - removed isStatic: true
const truckLipLeft = Matter.Bodies.rectangle(125, 490, 10, initialLipHeight, { // Initial height
    render: {
        fillStyle: 'brown'
    },
    label: 'truckLipLeft'
});

const truckLipRight = Matter.Bodies.rectangle(275, 490, 10, initialLipHeight, { // Initial height
    render: {
        fillStyle: 'brown'
    },
    label: 'truckLipRight'
});

// Constrain wheels to the truck body
const constraintOptions = {
    stiffness: 0.2,
    render: {
        visible: false
    }
}
const constraintWheelA = Matter.Constraint.create({ bodyA: truckBody, pointA: { x: -50, y: 40 }, bodyB: wheelA, pointB: { x: 0, y: 0 }, ...constraintOptions });
const constraintWheelB = Matter.Constraint.create({ bodyA: truckBody, pointA: { x: 50, y: 40 }, bodyB: wheelB, pointB: { x: 0, y: 0 }, ...constraintOptions });

// Constrain lips to the truck body - moved pointA.y up to -10
const constraintLipLeft = Matter.Constraint.create({ bodyA: truckBody, pointA: { x: -75, y: -10 }, bodyB: truckLipLeft, pointB: { x: 0, y: 0 }, stiffness: 0.8 });
const constraintLipRight = Matter.Constraint.create({ bodyA: truckBody, pointA: { x: 75, y: -10 }, bodyB: truckLipRight, pointB: { x: 0, y: 0 }, stiffness: 0.8 });

Matter.World.add(engine.world, [truckBody, wheelA, wheelB, constraintWheelA, constraintWheelB, truckLipLeft, truckLipRight, constraintLipLeft, constraintLipRight]);

// Character creation - isStatic: true added back
const character = {
    head: Matter.Bodies.circle(700, 200, 20, { isStatic: true, render: { fillStyle: 'lightBlue' }, label: 'character' }),
    arm1: Matter.Bodies.rectangle(700, 240, 5, 40, { isStatic: true, render: { fillStyle: 'lightBlue' }, label: 'character' }),
    arm2: Matter.Bodies.rectangle(700, 240, 5, 40, { isStatic: true, render: { fillStyle: 'lightBlue' }, label: 'character' }),
    nametag: Matter.Bodies.rectangle(700, 150, 60, 30, { // Increased nametag size
        isStatic: true,
        render: {
            fillStyle: 'green',
            text: {
                content: 'B', // Simplified text content
                size: 12, // Reduced text size
                color: 'red'  // Changed text color to red
            }
        },
        label: 'nametag'
    })
};

Matter.Body.rotate(character.arm1, 0.5, { x: 700, y: 220 }); // Rotate arms for throwing pose
Matter.Body.rotate(character.arm2, -0.5, { x: 700, y: 220 });

Matter.World.add(engine.world, [character.head, character.arm1, character.arm2, character.nametag]);

// Target X position for character sliding
let targetXPosition = 700;

// Function to update character's target position
function updateCharacterPosition(xPosition) {
    targetXPosition = xPosition;
}

// Function to add a box, now thrown by the character
function addBox() {
  const box = Matter.Bodies.rectangle(character.arm2.position.x + 20, character.arm2.position.y - 10, 30, 30, {
        render: {
            fillStyle: 'orange'
        },
        label: 'box',
        mass: 5, // Reduced mass to 5 (from 10)
    });
  Matter.Body.applyForce(box, {x: box.position.x, y: box.position.y}, {x: -0.03, y: -0.02}); // Apply initial force to throw
  Matter.World.add(engine.world, box);
  boxCount++; // Increment box count when a box is added
  return box;
}

// Keyboard controls - same as before
const keys = {
    left: false,
    right: false
};

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        keys.left = true;
    } else if (event.key === 'ArrowRight') {
        keys.right = true; // Corrected line
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') {
        keys.left = false;
    } else if (event.key === 'ArrowRight') {
        keys.right = false;
    }
});

Matter.Events.on(engine, 'beforeUpdate', () => {
    const force = 0.005;
    if (keys.left) {
        Matter.Body.applyForce(truckBody, truckBody.position, { x: -force, y: 0 });
        Matter.Body.setAngularVelocity(wheelA, -0.1);
        Matter.Body.setAngularVelocity(wheelB, -0.1);

    } else if (keys.right) {
        Matter.Body.applyForce(truckBody, truckBody.position, { x: force, y: 0 });
        Matter.Body.setAngularVelocity(wheelA, 0.1);
        Matter.Body.setAngularVelocity(wheelB, 0.1);
    }

    // World boundary check and truck repositioning
    const worldWidth = render.options.width;
    const truckWidth = 150; // Width of the truckBody
    const truckPositionX = truckBody.position.x;

    const boundaryForce = 0.02; // Adjust this value to control the strength of the boundary force

    if (truckPositionX < truckWidth / 2) {
        Matter.Body.applyForce(truckBody, truckBody.position, { x: boundaryForce, y: 0 });
    } else if (truckPositionX > worldWidth - truckWidth / 2) {
        Matter.Body.applyForce(truckBody, truckBody.position, { x: -boundaryForce, y: 0 });
    }

    // Smoothly move character towards targetXPosition
    const characterBody = character.head; // Use any part of the character, like the head
    const currentX = characterBody.position.x;
    const deltaX = targetXPosition - currentX;

    Matter.Body.setPosition(characterBody, { x: currentX + deltaX * 0.02, y: 200 }); // Adjust 0.05 for speed
    Matter.Body.setPosition(character.arm1, { x: currentX + deltaX * 0.02, y: 220 });
    Matter.Body.setPosition(character.arm2, { x: currentX + deltaX * 0.02, y: 220 });
    Matter.Body.setPosition(character.nametag, { x: currentX + deltaX * 0.02, y: 150 });

    // Check if it's time to increase the truck sides
    if (boxCount >= 4 && !sidesAreTaller) {
        makeSidesTaller();
    }
});

Matter.Engine.run(engine);
Matter.Render.run(render);

let boxCount = 0; // Counter for boxes on the truck
let sidesAreTaller = false; // Flag to track if sides are already taller

function makeSidesTaller() {
    Matter.Body.setVertices(truckLipLeft, Matter.Bodies.rectangle(125, 490, 10, increasedLipHeight).vertices);
    Matter.Body.setVertices(truckLipRight, Matter.Bodies.rectangle(275, 490, 10, increasedLipHeight).vertices);
    sidesAreTaller = true; // Set flag to prevent repeated height increases
}


// Add boxes periodically, thrown by character and move character
setInterval(() => {
    if (Math.random() < 0.8) {
      // Randomly position character at the top
      const randomX = Math.random() * (700 - 100) + 100; // Stay within screen bounds, adjust as needed
      updateCharacterPosition(randomX);
      addBox(); // Character throws a box
    }
}, 1500); // немного увеличено время между коробками

// Collision detection - boxes break only on ground
Matter.Events.on(engine, 'collisionStart', function(event) {
    event.pairs.forEach(pair => {
        if ((pair.bodyA.label === 'box' && pair.bodyB.label === 'ground') ||
            (pair.bodyB.label === 'box' && pair.bodyA.label === 'ground')) {
            if (pair.bodyA.label === 'box') {
                Matter.World.remove(engine.world, pair.bodyA);
            } else {
                Matter.World.remove(engine.world, pair.bodyB);
            }
        }
    });
});
