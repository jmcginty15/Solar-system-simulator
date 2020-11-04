# Solar System Explorer
*Developed by Jason McGinty*

Solar System Explorer is a browser application built to realistically depict the motions of the planets and moons of our solar system. It is [deployed and available for viewing through Heroku](https://solar-system-simulator.herokuapp.com/).

## Features

Solar System Explorer includes a total of 223 solar system bodies available for viewing, including the Sun, 8 planets, 5 dwarf planets, and 209 total moons. The user can select one of 13 preselected sets of bodies along with a date and time, and the application populates a simulated three-dimensional space with the selected set of bodies at their real positions relative to the solar system barycenter at the selected date and time.

Using these positions as a starting point, the application is capable of simulating and animating the motions of the selected solar system bodies in space. This is done according to Newtonian mechanics using the gravitational interactions between all bodies in the simulation. The user can select a name from a list of bodies currently in the simulation to center the view on that object.

## Standard User Flow

User selects a set of objects from the list:

![](https://raw.githubusercontent.com/jmcginty15/Solar-system-simulator/master/README/userflow1-1.png)

User selects a date and time and clicks the Go! button:

![](https://raw.githubusercontent.com/jmcginty15/Solar-system-simulator/master/README/userflow1-2.png)

The application queries NASA's JPL Horizons database for object positions and velocities via the astroquery Python module. Once finished, the object list will populate and the user can select an object from the list to view:

![](https://raw.githubusercontent.com/jmcginty15/Solar-system-simulator/master/README/userflow2-1.png)

The user can play, pause, or adjust the speed of the simulation on screen using the controls and the animation will respond accordingly:

![](https://raw.githubusercontent.com/jmcginty15/Solar-system-simulator/master/README/userflow1-3.png)

Some information about the currently selected object or system is displayed in the bottom left panel of the UI:

![](https://raw.githubusercontent.com/jmcginty15/Solar-system-simulator/master/README/userflow1-4.png)

## Tools and Techniques

### Backend

The backend of this application is written in Python version 3.8.6 and uses a PostgreSQL database to store object names, designations, IDs, dimensions, masses, paths to textures, and other information. The server is built with Flask and uses Flask-SQLAlchemy to communicate with the database. The server makes queries to [NASA's JPL Horizons database](https://ssd.jpl.nasa.gov/?horizons) to determine the positions and velocities of objects at the date and time selected by the user. These queries are made via the [astroquery.jplhorizons Python submodule](https://astroquery.readthedocs.io/en/latest/jplhorizons/jplhorizons.html).

### Frontend

The frontend of this application is written in JavaScript and uses JQuery for DOM manipulation and Axios for requests to the Flask server. 3D modeling and animation is done with the [Three.js JavaScript library](https://threejs.org/). All UI styles were written in CSS by the developer.

### Techniques

The application uses the positions and velocities received from JPL Horizons as initial conditions and runs the simulation forward in time. Newton's Law of Universal Gravitation is used to calculate gravitational forces between all objects in the simulation, and the [Barnes-Hut approximation algorithm](https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation) is used to reduce the number of calculations needed for each time step. Gravitational forces are summed for each object and used along with each object's mass to calculate accelerations. Accelerations are then used to update velocities, and velocities are used to update positions, which are then updated in the animation on screen frame by frame.

## Other Resources

Object texture maps were obtained from [JHT's Planetary Pixel Emporium](http://planetpixelemporium.com/planets.html), [Steve Albers' Planetary Maps Page](http://stevealbers.net/albers/sos/sos.html), and [Solar System Scope](https://www.solarsystemscope.com/textures/). The Milky Way background texture was obtained from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:ESO_-_Milky_Way.jpg). Objects are visually represented on screen as ellipsoids according to their dimensions in the SQL database. Texture maps were only available for the Sun, planets, dwarf planets, and some of the larger moons. Objects without available texture maps are simply represented as blank white ellipsoids. Object names, masses, and dimensions were painstakingly searched for by the developer, mostly through Wikipedia, and entered into the SQL database.