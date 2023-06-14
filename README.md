# ch3ss-v2
This is a cheat program for online chess games. Currently working fine on chess.com and lichess.org. If you want to modify settings you will have to go in and change some variables, sorry.

to install:
`npm install`

to run:
`node index.js`
or
`node lich.js`

A test browser should automatically open, if not try installing puppeteer manually.
After each game you have to refresh as I have not implemented another way to reset it. Only games on the initial browser tab will be modified, if you go to a new tab it will not work.

This whole program is a hack using a webscraper to interact with the browser chess board, moves are read using the display so smaller display sizes might not work. You can use the key "g" in bullet mode to play a move, "f" to display moves on the board, and press the automove check box to turn on full auto mode. I highly reccomend playing against bots only as you will get banned. This is also just a fun project I made as there are sites that charge upwards of $15 a month for similar software.
