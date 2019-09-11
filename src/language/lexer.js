// //Math operators
// var PLUS = "PLUS";
// var MINUS = "MINUS";
// var DIVIDE = "DIVIDE";
// var ASTERISK = "ASTERISK";
// var MOD = "MOD";

// //Comparison Operators
// var MORE_OR_EQUAL = "MORE_OR_EQUAL";
// var MORE = "MORE";
// var LESS_OR_EQUAL = "LESS_OR_EQUAL";
// var LESS = "LESS";
// var EQUAL = "EQUAL";
// var NOT_EQUAL = "NOT_EQUAL";

// //Types (identifier/integer)
// var IDENTIFIER = "IDENTIFIER";
// var INTEGER = "INTEGER";
// var STRING = "STRING";

// //Statements specific to sound
// var NOTE = "NOTE";
// var REST = "REST";
// var BPM = "BPM";
// var PLAY = "PLAY";

// //Formatting operators
// var EOF = "EOF";
// var LEFT_PARENTHESIS = "LEFT_PARENTHESIS";
// var RIGHT_PARENTHESIS = "RIGHT_PARENTHESIS";
// var COMMA = "COMMA";

// //Conditionals and Loops
// var REPEAT = "REPEAT";
// var IF = "IF";
// var ELSE = "ELSE";
// var END = "END";

// //Print, assign, and functions
// var PRINT = "PRINT";
// var ASSIGN = "ASSIGN";
// var AT = "AT";

import { variables } from "@/language/variables.js";

export default {
  lex(source) {
    console.log(source);
    var tokens = [];
    var tokenSoFar = "";
    var i = 0;

    function has(regex) {
      return source.charAt(i).match(regex);
    }

    function next() {
      tokenSoFar += source.charAt(i);
      i += 1;
    }

    function store(type) {
      tokens.push({
        type: type,
        source: tokenSoFar
      });
      tokenSoFar = "";
    }

    while (i < source.length) {
      if (has(/\+/)) {
        //start math operators
        next();
        store(variables.PLUS);
      } else if (has(/-/)) {
        next();
        store(variables.MINUS);
      } else if (has(/\//)) {
        next();
        if (has(/\//)) {
          //for comments
          while (has(/[^\n]/)) {
            next();
          }
          tokenSoFar = "";
        } else {
          store(variables.DIVIDE);
        }
      } else if (has(/\//)) {
        next();
        store(variables.DIVIDE);
      } else if (has(/\*/)) {
        next();
        store(variables.ASTERISK);
      } else if (has(/%/)) {
        next();
        store(variables.MOD); //end math operators
      } else if (has(/!/)) {
        //start comparison operators
        next();
        if (has(/=/)) {
          next();
          store(variables.NOT_EQUAL);
        } else {
          throw "Error: expected '=' after '!'";
          //document.getElementById("errors").innerHTML = document.getElementById("errors").innerHTML + "Error: expected \'=\' after \'!\'" + "\n";
        }
      } else if (has(/=/)) {
        next();
        if (has(/=/)) {
          next();
          store(variables.EQUAL);
        } else {
          store(variables.ASSIGN);
        }
      } else if (has(/</)) {
        next();
        if (has(/=/)) {
          next();
          store(variables.LESS_OR_EQUAL);
        } else {
          store(variables.LESS);
        }
      } else if (has(/>/)) {
        next();
        if (has(/=/)) {
          next();
          store(variables.MORE_OR_EQUAL);
        } else {
          store(variables.MORE);
        } //end comparison operators
      } else if (has(/\(/)) {
        //start formatting operators
        next();
        store(variables.LEFT_PARENTHESIS);
      } else if (has(/\)/)) {
        next();
        store(variables.RIGHT_PARENTHESIS);
      } else if (has(/,/)) {
        next();
        store(variables.COMMA); //end formatting operators
      } else if (has(/\d/)) {
        while (has(/\d/)) {
          next();
        }
        store(variables.INTEGER);
      } else if (has(/"/)) {
        next();
        while (!has(/"/)) {
          next();
        }
        next();
        store(variables.STRING);
      } else if (has(/[a-zA-Z@]/)) {
        while (has(/[a-zA-Z0-9@]/)) {
          next();
        }

        if (tokenSoFar == "note") {
          store(variables.NOTE);
        } else if (tokenSoFar == "rest") {
          store(variables.REST);
        } else if (tokenSoFar == "bpm") {
          store(variables.BPM);
        } else if (tokenSoFar == "play") {
          store(variables.PLAY);
        } else if (tokenSoFar == "repeat") {
          store(variables.REPEAT);
        } else if (tokenSoFar == "if") {
          store(variables.IF);
        } else if (tokenSoFar == "else") {
          store(variables.ELSE);
        } else if (tokenSoFar == "end") {
          store(variables.END);
        } else if (tokenSoFar == "print") {
          store(variables.PRINT);
        } else if (tokenSoFar == "@") {
          store(variables.AT);
        } else {
          store(variables.IDENTIFIER);
        }
      } else if (has(/\s/)) {
        next();
        tokenSoFar = "";
      } else {
        var nonsense = next();
        tokenSoFar = nonsense;
        throw "Error: token [" + tokenSoFar + "] not recognized.";
      }
    }

    store(variables.EOF);
    return tokens;
  }
};
