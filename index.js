



var prompt = require("prompt-sync")({ sigint: true });;
const internal = require("stream");
var loadEngine = require("./load_engine.js");

// you need to install stockfish via npm
var engine = loadEngine(require("path").join(__dirname, "node_modules/stockfish/src/stockfish.js")); 

function uci(cmd, cb = (data) => {console.log(data)}){
    engine.send(cmd, function onDone(data){
        
        cb(data)
    }, 
    function onStream(data){
        
    });
}




(async () => {
    var AUTO_MOVE = false
    const puppeteer = require("puppeteer");
  
    const {Chess} = require("chess.js");

    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://chess.com/');
    const setTimeoutPromise = timeout => new Promise(resolve => {        
        setTimeout(resolve, timeout);
      });
    


    page.on("load", () => {
        console.log("Page loaded!");
        chess = new Chess()
        moves = []
        userColor = ""
        lastMoves = null
        resetEngine()

    })

    
    var chess = new Chess()

    var stockfish = {
        calc : false,
        uciok : false,
        bestmove : null
        
    }

    var moves = []

    var userColor = ""

    function engineResponse(line){
        
        if (typeof line !== "string") {
            console.log("non string in onmessage: " + line);
            stockfish.calculating = false
            return;
        }
        if (line == "uciok") {
            stockfish.uciok = true;
           
        } else if (stockfish.calculating) {
            if (line == "readyok") {
                stockfish.calculating = false;
                
            }
        }

        if (line.indexOf("bestmove") > -1) {
            console.log(line)
            var match = line.match(/bestmove\s+(\S+)/);
            
            if (match) {
                
                stockfish.bestmove = match[1];
                
            }
        }
        stockfish.calculating = false;
    }
    
    async function engineCommand(com){
        uci(com,engineResponse)
        stockfish.calculating = true

        while(stockfish.calculating){
            await setTimeoutPromise(10)
        }
    }

    async function enginePrep(){
        if (!stockfish.uciok){
            await engineCommand('uci')
        }
        await engineCommand('isready')
    }

    async function resetEngine(){
        uci("ucinewgame")
        
    }

    async function findMoves(){
        var result = []
        try {
                result = await page.evaluate(() =>{
                    var moves = []
                    var movesDiv = document.querySelector("#board-layout-sidebar > div > div.play-controller-moves-container > div.play-controller-scrollable > vertical-move-list")
                    if (!movesDiv){
                        movesDiv = document.querySelector("#live-game-tab-scroll-container > move-list-wc > vertical-move-list")
                    }
                        
                    if (movesDiv){

                        var board = document.querySelector("#board-layout-chessboard > chess-board")
                        var bRect = board.getBoundingClientRect()
                        if(!document.getElementById("hackcontrol")){
                            var hackcontrol = document.createElement("div")
                            hackcontrol.id = "hackcontrol"
                            hackcontrol.style.position = "absolute"
                            hackcontrol.style.top = bRect.y + bRect.height + window.scrollY + "px"
                            hackcontrol.style.left = bRect.x + bRect.width + window.scrollX + "px"
                            
                            hackcontrol.style.width = bRect.width / 2 + "px"
                            hackcontrol.style.border = "medium solid green"
                            hackcontrol.style.display = "inline-block"
        
                            var input = document.createElement("input")
                            input.id = "hackautomove"
                            input.setAttribute("type","checkbox")
        
                            var label = document.createElement("p")
                            label.innerHTML = "ch3ss: auto move"
                            label.style.color = "magenta"
                            
                            hackcontrol.appendChild(label)
                            hackcontrol.appendChild(input)
                            
        
                            document.body.appendChild(hackcontrol)
                        }/*else{
                            var hackcontrol = document.getElementById("hackcontrol")
                            hackcontrol.style.top = bRect.y + bRect.height + window.scrollY + "px"
                            hackcontrol.style.left = bRect.x + bRect.width + window.scrollX + "px"
                        }*/



                        movesDiv = movesDiv.children
                        for (moveSet of movesDiv){
                            for (move of moveSet.children){
                                if (move.classList.contains("node")){
                                    var icon = move.children[0]
                                    var data = ""
                                    var number = move.innerHTML.split("<")
                                    data += number[0]
                                    if (data.length <= 0){
                                        number = move.innerHTML.split(">")
                                    }else{
                                        number = [""]
                                    }
                                    if(icon && icon.getAttribute("data-figurine")){
                                        data += icon.getAttribute('data-figurine')
                                    }
                                    
                                    
                                    data += number[number.length - 1]
                                    
                                    if (data.length > 1){
                                        moves.push(data)
                                    }
                                }
                            }
                        }
                    }
                    
                    return moves
                })
        }catch(e){console.log("couldnt find moves")}
        
        // chess
        var amtNew = result.length - moves.length
        
        if (amtNew > 0){
            for (var i = result.length - amtNew; i < result.length; i++){
                try{
                    chess.move(result[i]);
                }catch(e){
                    console.log("MOVE: " + result)
                }
            }
            stockfish.bestmove = null
        }

        return result
        
    }

    async function getLocalColor() {
        try {
        var inputString = await page.evaluate(() => {
            var i = prompt("ch3ss: [w/b]?");
            var ret = "";
            if (i == "b" || i == "B") {
                ret = "b";
            }else if (i == "w" || i == "W"){
                ret = "w";
            } else {
                console.log(i);
            }
            return ret;
        })
        return inputString;
        } catch (e) {
            eCatch(e, "getLocalColor()");
            return "";
        }
    }

    async function calculate(){
        await enginePrep()
        const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        let moves = chess.history({verbose:true}).map((h) => {return h.lan}).join(" ")
        await engineCommand("position fen " + fen + " moves " + moves)
        await enginePrep()

        var depth = "5"
        var l = moves.length
        if (l < 20){
            depth = "8"
        }else if (l >= 20 && l < 35){
            depth = "12"
        }else if (l >= 35 && l < 50){
            depth = "8"
        }
        else if (l >= 50 < 100) {
            depth = "7"
        } else{
            depth = "5"
        }
        
        while (!stockfish.bestmove){
            
            if (stockfish.calculating == false){
                await engineCommand("go depth " + depth)
                
            }
            await setTimeoutPromise(5)
        }
    }

    async function viewMove(){
        try{
            
            var cpositions = await page.evaluate((bestmove, userColor) => {
                var board = document.querySelector("#board-layout-chessboard > chess-board")
                if (!board){return}
                var fromRect, toRect;
                
                var letterVal = {
                    "a":1,
                    "b":2,
                    "c":3,
                    "d":4,
                    "e":5,
                    "f":6,
                    "g":7,
                    "h":8,
                };
                var bRect = board.getBoundingClientRect()
                const squarelen = bRect.width / 8.0;
                var moveSplit = bestmove.split("")
                
                if (userColor == "w"){
                    fromRect = {
                        x:window.scrollX + bRect.x + (squarelen * (letterVal[moveSplit[0]] - 1)),
                        y:window.scrollY + bRect.y + (squarelen * (8 - parseInt(moveSplit[1]))),
                        width:squarelen,
                        height:squarelen
                    };
                    toRect = {
                        x:window.scrollX + bRect.x + (squarelen * (letterVal[moveSplit[2]] - 1)),
                        y:window.scrollY + bRect.y + (squarelen * (8 - parseInt(moveSplit[3]))),
                        width:squarelen,
                        height:squarelen
                    };
                }else{
                    letterVal = {
                        "a":8,
                        "b":7,
                        "c":6,
                        "d":5,
                        "e":4,
                        "f":3,
                        "g":2,
                        "h":1,
                    };
                    var numVal = [0,8,7,6,5,4,3,2,1];
                    fromRect = {
                        x:window.scrollX + bRect.x + (squarelen * (letterVal[moveSplit[0]] - 1)),
                        y:window.scrollY + bRect.y + (squarelen * (8 - numVal[parseInt(moveSplit[1])])),
                        width:squarelen,
                        height:squarelen
                    };
                    toRect = {
                        x:window.scrollX + bRect.x + (squarelen * (letterVal[moveSplit[2]] - 1)),
                        y:window.scrollY + bRect.y + (squarelen * (8 - numVal[parseInt(moveSplit[3])])),
                        width:squarelen,
                        height:squarelen
                    };
                }

                
                
                

                var moveFrom = document.createElement("div");
                var moveTo = document.createElement("div");
                moveFrom.id = "moveFrom";
                moveFrom.style.position = "absolute";
                moveFrom.style.top = fromRect.y + "px";
                moveFrom.style.left = fromRect.x + "px";
                moveFrom.style.width = fromRect.width + "px";
                moveFrom.style.height = fromRect.height + "px";
                moveFrom.style.border = "medium solid red";
                moveFrom.style.pointerEvents = "none";
                moveTo.id = "moveTo";
                moveTo.style.position = "absolute";
                moveTo.style.top = toRect.y + "px";
                moveTo.style.left = toRect.x + "px";
                moveTo.style.width = toRect.width + "px";
                moveTo.style.height = toRect.height + "px";
                moveTo.style.border = "medium solid blue";
                moveTo.style.pointerEvents = "none";

                document.body.appendChild(moveFrom)
                document.body.appendChild(moveTo)

                return {fx: fromRect.x + (fromRect.width / 2),
                        fy: fromRect.y + (fromRect.height / 2),
                        tx: toRect.x + (toRect.width / 2),
                        ty: toRect.y + (toRect.height / 2)}
                
            }, stockfish.bestmove, userColor)
        } catch(e){return}
        AUTO_MOVE = await page.evaluate(() => {
            var checker = document.getElementById("hackautomove")
            return checker && checker.checked
        })
        if (AUTO_MOVE){
            await timeoutByMoveCount(moves.length)
            await page.mouse.click(cpositions.fx,cpositions.fy, {delay:0})
            await setTimeoutPromise(5)
            await page.mouse.click(cpositions.tx,cpositions.ty, {delay:0})
            setTimeoutPromise(10)
            await page.mouse.click(cpositions.tx,cpositions.ty, {delay:0})
            await page.mouse.click(0,0, {delay:0})
        }
        try{

        }catch(e){}

    }

    async function timeoutByMoveCount(l) {
        var random = Math.floor(Math.random() * 800)
        var timeout = 1
        if (l < 20){
            timeout = l 
            timeout += random / 2
        }else if (l >= 20 && l < 35){
            timeout = Math.floor(Math.random() * 1600) 
            timeout += random
        }else if (l >= 35 && l < 50){
            timeout = Math.floor(Math.random() * 300) 
            timeout += random
        }
        else if (l >= 50 < 100) {
            timeout = Math.floor(Math.random() * 500) 
            timeout += random / 2
        } else{
            timeout = math.floor(Math.random() * 50)
        }
        await setTimeoutPromise(timeout)

    }

    async function unviewMove() {
        try{
            await page.evaluate(() => {
                var moveFrom = document.getElementById("moveFrom");
                var moveTo = document.getElementById("moveTo");
                if (moveFrom) {
                    moveFrom.parentNode.removeChild(moveFrom);
                }
                if (moveTo) {
                    moveTo.parentNode.removeChild(moveTo);
                }
            });
        }catch(e){
            console.log(e);
        }
    }
/*
   while(true){
    await setTimeoutPromise(1000)
   }*/
     await enginePrep()
     uci("setoption name Threads value 4")
     uci("setoption name Hash value 32")
     uci("setoption name Contempt value 100")
     uci("setoption name Skill Level value 20")
     await enginePrep()
     
    while (true){
        moves = await findMoves()
        
        if (moves.length > 0 && !stockfish.bestmove){
            console.log(moves)
            await unviewMove()
            userColor = userColor == "" ? await getLocalColor(): userColor
            if (moves.length % 2 == 0){
                
                if (userColor == "w"){
                    await calculate()
                    await viewMove()
                    
                }
            }else{
                if (userColor == "b"){
                    await calculate()
                    await viewMove()
                }
            }

            lastMoves = moves

        }
        await setTimeoutPromise(20)
    }
       
    



    await browser.close()
})()