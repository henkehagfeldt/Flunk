var express = require('express');
var router = express.Router();
const moment = require("moment");

var games = ['100'];
var active_game_codes = {};

function code_generator(game_id, player_id){
  let code = "";
  // 49-57 numbers
  // 65-90
  do{
    code = "";
    for(let i = 0; i < 5; i++){
      let numb = (Math.round(Math.random() * 41) + 49);
      if(numb > 57 && numb < 65){
        numb += 8;
      }
      code += String.fromCharCode(numb);
    }
  }
  while(code in active_game_codes)

  active_game_codes[code] = {
    'ts_created': moment(),
    'ts_heartbeat': moment(),
    'players': [player_id],
    'leader': player_id,
    'game': game_id
  };

  console.log("New Game Created", active_game_codes[code].ts_created.format(), "Active games: ", active_game_codes)
  return code;
}

/* Make a new game room*/
router.get('/create/:game_id', function(req, res, next) {

  console.log("Body: ", req.body);
  console.log("Player: ", req.body.player_id);
  if(req.body.player_id == undefined){
    res.status(400);
    res.send("No player id");
  }

  let room_info = {
    'code': '',
    'game_id': undefined
  }

  
  room_info.game_id = parseInt(req.params.game_id);
  console.log("game_id is set to ", room_info.game_id);

  // Valid game id check
  if(isNaN(room_info.game_id) || room_info.game_id >= games.length || room_info.game_id < 0){
    res.status(400);
    res.send("Invalid game id");
  }

  room_info.code = code_generator(room_info.game_id, req.body.player_id);

  res.json(room_info);
});

router.post('/leave/:game_code', function(req, res, next){
  if(req.body.player_id == undefined){
    res.status(400);
    res.send("No player id.");
  }
  else if(!(req.params.game_code in active_game_codes)){
    res.status(400);
    res.send("Unknown game code");
  }
  else{
    // Remove player from game player list
    active_game_codes[req.params.game_code].players = active_game_codes[req.params.game_code].players.filter(p => p != req.body.player_id);
    console.log("Player Removed, New game state: ", active_game_codes[req.params.game_code]);
    
    // TODO: Check if leader left, WS to players
    
    // Check if game is empty
    if(active_game_codes[req.params.game_code].players.length == 0){
      delete active_game_codes[req.params.game_code];
      console.log("Game Removed, New game state: ", active_game_codes);
    }
    res.send("Removed from game");
  }
  
});
module.exports = router;
