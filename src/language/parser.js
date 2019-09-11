import { variables } from "@/language/variables.js";
import ast from "@/language/ast.js";

export default {
  parse(tokens) {
    console.log(tokens);
    var i = 0;

    function statement() {
      if (has(variables.AT)) {
        return define();
      } else if (has(variables.NOTE)) {
        next();
        var frequency = expression();
        var oscillatorType = atom();
        var noteLength = expression();
        return new ast.StatementNote(frequency, oscillatorType, noteLength);
      } else if (has(variables.REST)) {
        next();
        var restLength = expression();
        return new ast.StatementRest(restLength);
      } else if (has(variables.BPM)) {
        next();
        var beatsPerMinute = expression();
        return new ast.StatementBPM(beatsPerMinute);
      } else if (has(variables.PRINT)) {
        next();
        var message = expression();
        return new ast.StatementPrint(message);
      } else if (has(variables.PLAY)) {
        next();
        var object = expression();
        return new ast.StatementPlay(object);
      } else if (has(variables.REPEAT)) {
        return loop();
      } else if (has(variables.IF)) {
        return conditional();
      } else if (has(variables.IDENTIFIER)) {
        var idToken = next();

        if (has(variables.ASSIGN)) {
          next();
          var rhs = expression();
          return new ast.StatementAssignment(idToken.source, rhs);
        } else if (has(variables.LEFT_PARENTHESIS)) {
          next();
          var actuals = [];
          while (!has(variables.RIGHT_PARENTHESIS)) {
            actuals.push(expression());
          }
          next(); // eat )
          return new ast.StatementAtCall(idToken.source, actuals);
        } else if (!has(variables.ASSIGN)) {
          throw "Error: Invalid Input " + tokens[i].source;
        }
      } else {
        throw "Error: [" + tokens[i].source + "] not recognized. ";
      }
    }

    function has(tokenType) {
      return i < tokens.length && tokens[i].type == tokenType;
    }

    function next() {
      var token = tokens[i];
      i++;
      return token;
    }

    function program() {
      var statements = [];
      while (!has(variables.EOF)) {
        statements.push(statement());
      }
      return new ast.Block(statements);
    }

    function conditional() {
      next();
      var condition = expression();
      var thenStatements = [];

      while (i < tokens.length && !has(variables.ELSE) && !has(variables.END)) {
        thenStatements.push(statement());
      }

      var elseStatements = [];

      if (has(variables.ELSE)) {
        next();
        while (i < tokens.length && !has(variables.END)) {
          elseStatements.push(statement());
        }
      }

      if (!has(variables.END)) {
        throw "Error: You started a conditional block without concluding it with an 'end' token";
      }
      next(); // eat end

      var thenBlock = new ast.Block(thenStatements);
      var elseBlock = new ast.Block(elseStatements);

      return new ast.ExpressionIf(condition, thenBlock, elseBlock);
    }

    function loop() {
      next();
      var condition = expression();
      var statements = [];
      while (!has(variables.END)) {
        statements.push(statement());
        if (has(variables.EOF)) {
          if (!has(variables.END)) {
            throw "Error: You started a repeat loop without concluding it with an 'end' token";
          }
        }
      }

      next();
      return new ast.StatementRepeat(condition, new ast.Block(statements));
    }

    function define() {
      next();
      var nameToken = next();
      next();
      var formals = [];
      while (!has(variables.RIGHT_PARENTHESIS)) {
        var formalToken = next();
        formals.push(formalToken.source);
      }
      next();
      var statements = [];
      while (!has(variables.END)) {
        statements.push(statement());
        if (has(variables.EOF)) {
          if (!has(variables.END)) {
            throw "Error: You started a function without concluding it with an 'end' token";
          }
        }
      }
      next();
      return new ast.StatementAt(
        nameToken.source,
        formals,
        new ast.Block(statements)
      );
    }

    function expression() {
      return relational();
    }

    function relational() {
      var a = additive();
      while (
        has(variables.MORE_OR_EQUAL) ||
        has(variables.MORE) ||
        has(variables.LESS_OR_EQUAL) ||
        has(variables.LESS) ||
        has(variables.EQUAL) ||
        has(variables.NOT_EQUAL)
      ) {
        var operator = tokens[i];
        next(); // eat operator
        var b = additive();
        if (operator.type == variables.MORE_OR_EQUAL) {
          a = new ast.ExpressionMoreOrEqual(a, b);
        } else if (operator.type == variables.MORE) {
          a = new ast.ExpressionMore(a, b);
        } else if (operator.type == variables.LESS_OR_EQUAL) {
          a = new ast.ExpressionLessOrEqual(a, b);
        } else if (operator.type == variables.LESS) {
          a = new ast.ExpressionLess(a, b);
        } else if (operator.type == variables.EQUAL) {
          a = new ast.ExpressionEqual(a, b);
        } else {
          a = new ast.ExpressionNotEqual(a, b);
        }
      }
      return a;
    }

    function additive() {
      var l = multiplicative();
      while (has(variables.PLUS) || has(variables.MINUS)) {
        var operatorToken = next();
        var r = multiplicative();
        if (operatorToken.type == variables.PLUS) {
          l = new ast.ExpressionAdd(l, r);
        } else {
          l = new ast.ExpressionSubtract(l, r);
        }
      }

      return l;
    }

    function multiplicative() {
      var a = atom();
      while (
        has(variables.ASTERISK) ||
        has(variables.DIVIDE) ||
        has(variables.MOD)
      ) {
        var operator = tokens[i];
        next(); // eat operator
        var b = atom();
        if (operator.type == variables.ASTERISK) {
          a = new ast.ExpressionMultiply(a, b);
        } else if (operator.type == variables.MOD) {
          a = new ast.ExpressionMod(a, b);
        } else {
          a = new ast.ExpressionDivide(a, b);
        }
      }
      return a;
    }

    function atom() {
      if (has(variables.INTEGER)) {
        let token = next();
        return new ast.ExpressionIntegerLiteral(parseInt(token.source));
      } else if (has(variables.STRING)) {
        let token = next();
        return new ast.ExpressionString(token.source);
      } else if (has(variables.NOTE)) {
        return statement();
      } else if (has(variables.REST)) {
        return statement();
      } else if (has(variables.IDENTIFIER)) {
        let token = next();
        return new ast.ExpressionVariableRef(String(token.source));
      } else if (has(variables.LEFT_PARENTHESIS)) {
        next();
        var e = expression();
        if (!has(variables.RIGHT_PARENTHESIS)) {
          throw "Error: Missing Right Parenthesis";
        }
        next();
        return e;
      } else {
        throw "Error: I expected an expression, but instead I found '" +
          tokens[i].source +
          "'. Check for missing attributes for keywords and/or misspelled keywords";
      }
    }

    return program();
  }
};
