TODO
====
1. Implement chat channel for all players
2. When the server can't be reached, locally pause the game and display an "Unavailable" message

Completed
=========
1. Implement logic to reset the game (on events such as new match or after a score)
1. Fix bouncing when the ball hits an obstacle at an angle 
1. Factor connection code into seperate modules (initial connection -> game channel)
1. Finish socket disconnection logic (impl removePlayer on game)
1. Implement queueing for waiting players