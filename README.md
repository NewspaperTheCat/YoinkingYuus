# Yoinking Yuus
By: James Prendergast, Zack Robinson, Trey Bowen

# A brief description of what you created.
We made a small interactrive scene inspired by the Nintendo Wii's Mii menu screen. In that screen, various "Miis" walk around randomly; you as the player have the ability to pick them up, move them around, and drop them anywhere in the scene. Taking a light hearted knock-off title, we called our littler humaniod characters "Yuus". Our scene features these Yuus with the described behavior of grabbing, moving, and releasing. Our Yuu's pathing is also adaptive to our resizable ground plane.

# A description of how each of the above topics are represented in your program.
Splines, drawn using Catmull-Rom, uniform B-splines, or another algorithm of your choice (other than Chaikin)
    The Yuus each generate Catmull-Rom splines during their wander state
Quaternions and SLERPing
    The aforementioend Yuus then follow their path through SLERPing quaternions
Shape deformation
    The ground plane's mesh is defined by the location of the pins. Each pin is adjustable.
    To a lesser degree, each Yuu is generated with a random sqaush/stretch.
Skeletal animation
    The whole project is under a robust hierarchical node system.
    The Yuus in their wander state have a walk cycle that simply utilizes this overarching architecture.
Hierarchical modeling & inverse kinematics
    The project structure is fits the first half of this requirement.
    When grabbing a Yuu, you hold them up by their hand to which their arm exhibits inversekinmatics back down to their body.
Physically-based animation
    Upon releasing a Yuu, a small kinematics equation computes an initial velocity.
    In their freefall state, then are then animated to follow that curve down to where the mouse was hovering on the time of release.
(Optional) Particle systems
    Different from the boids done in class, but the Yuus swarm with the systematic complex regenerating spline behavior described earlier.
(Optional) Obstacle avoidance
    Yuus stay within the bounds of the ground plane, adaptively redirecting themselves back to valid locations when outside of it.
    In this way, they are avoiding anywhere that is not the ground plane.

# Instructions for setting up a server to run your project, if applicable.
Yoinking Yuus is simply comprised of .html and .js files.
All that is required is to open the index.html file in a browser that supports WebGL.

# Any additional instructions that might be needed to fully use your project (interaction controls, etc.)
The project uses click detection through a custom raycasting system.
Standard web mouse cursors communicate minimal interactive information (hovering over grabbables, currently grabbing, etc.)
You can interact with the Yuus moving around and the pins in the corner of the ground.

# What challenges you faced in completing the project.
Our group of 3 had 2 seniors who were wrapping up their respective MQPs. This added a lot of stress to time management and required effect team communication to reach this course's objectives while respecting the various due dates and workloads.
Calculating valid points within the ground plane proved to be rather difficult, especially with the ground being so adaptive,
specifically the problem was when it was self-intersecting, and also a visual discrepancy sometimes when it's concave.
Inverse Kinematics was generally difficult.
The team had varying familiarity with the systems we each made. This only arose as an issue with core systems like the click detection and hierarchical node structure as a decent understanding was required to make any progress.

# What each group member was responsible for designing / developing.
We had a helpful Kanban board for the entire project which made management a lot more streamlined.

Zack:
 - Spline and quaternion generation: select points within ground plane bounds 
 - Yuu state logic: “wander” & “grabbed” defining what behavior they follow
 - Yuu abiding by and triggering spline generation 
 - Inverse kinematics from mouse to Yuu’s shoulder 

Trey:
 - Yuu model: humanoid defined by a hierarchical skeleton; must have arms with forearm, upper arm, and elbow connecting them 
 - Implement node based hierarchy
 - Yuu walk cycle 
 - Fix ground plane edge cases

James:
 - Project proposal
 - Positioned camera with perspective projection 
 - Ground plane with pins in corner 
 - Click and drag interaction with ground plane pins 
 - Click to world detection: can detect if a Yuu is clicked on (raised invisible plane) 
 - Yuu perspective guided movement/general conversion to grabbed state 
 - Dragging making the chosen Yuu’s body follow 
 - Release velocity calculation through kinematics 
 - Custom mouse cursor for each state and hover (likely web standard ones) 
 - Yuu landing and conversion to wander state

# How you used AI to assist you with this project. (If you did not use it at all, state that.)
No team memebers used AI in creating this project. Elements from in class exercise were adapted and reused to fit our project's needs.

# Any external references you used outside of the provided class materials. These do not have to be formal citations, but you should briefly describe each one.
No novel code concepts were copied off sights. Standard references to Stack Overflow, Reddit, and the javascript documentation were used abundantly to familarize ourselves with concepts and syntax.
