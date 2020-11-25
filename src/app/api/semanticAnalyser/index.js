import {
  ErrorType,
  PrecedenceTableType,
  SymbolsType,
  SymbolTableType,
} from '../../enum/token';

export default class SemanticAnalyser {
  constructor() {
    this.symbolTable = [];
    this.scopeTable = [];
    this.actualScope = 0;

    this.expression = [];
    this.expressionStack = [];
    this.expressionLevel = 0;

    this.digits = /^\d+$/;
  }

  precedenceTable = [
    { lexema: ')', level: 8 },
    {
      lexema: '-unao',
      level: 7,
      operators: 1,
      type: PrecedenceTableType.BOOLEAN,
      return: PrecedenceTableType.BOOLEAN,
    },
    {
      lexema: '-u',
      level: 7,
      operators: 1,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.INTEGER,
    },
    {
      lexema: '+u',
      level: 7,
      operators: 1,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.INTEGER,
    },
    {
      lexema: 'nao',
      level: 7,
      operators: 1,
      type: PrecedenceTableType.BOOLEAN,
      return: PrecedenceTableType.BOOLEAN,
    },
    {
      lexema: '*',
      level: 6,
      operators: 2,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.INTEGER,
    },
    {
      lexema: 'div',
      level: 6,
      operators: 2,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.INTEGER,
    },
    {
      lexema: '-',
      level: 5,
      operators: 2,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.INTEGER,
    },
    {
      lexema: '+',
      level: 5,
      operators: 2,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.INTEGER,
    },
    {
      lexema: '>',
      level: 4,
      operators: 2,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.BOOLEAN,
    },
    {
      lexema: '>=',
      level: 4,
      operators: 2,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.BOOLEAN,
    },
    {
      lexema: '<',
      level: 4,
      operators: 2,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.BOOLEAN,
    },
    {
      lexema: '<=',
      level: 4,
      operators: 2,
      type: PrecedenceTableType.INTEGER,
      return: PrecedenceTableType.BOOLEAN,
    },
    {
      lexema: '=',
      level: 3,
      operators: 2,
      type: PrecedenceTableType.BOTH,
      return: PrecedenceTableType.BOOLEAN,
    },
    {
      lexema: '!=',
      level: 3,
      operators: 2,
      type: PrecedenceTableType.BOTH,
      return: PrecedenceTableType.BOOLEAN,
    },
    {
      lexema: 'e',
      level: 2,
      operators: 2,
      type: PrecedenceTableType.BOOLEAN,
      return: PrecedenceTableType.BOOLEAN,
    },
    {
      lexema: 'ou',
      level: 1,
      operators: 2,
      type: PrecedenceTableType.BOOLEAN,
      return: PrecedenceTableType.BOOLEAN,
    },
    { lexema: '(', level: 0 },
  ];

  Error = (reason, token) => {
    const error = new Error(reason);
    if (token) {
      error.line = token.line;
      error.token = token;
    }
    error.reason = reason;
    error.type = 'semantico';

    throw error;
  };

  /*
    {
      token: {
        lexema: 'alguma',
        simbolo: 's',
        linha: 0,
      },
      type: "variavel",
      declarationType: "",
      scope: 0,
      label: "",
    }
  */

  compareIdentifierType = (compareType, symbolsType) => {
    if (typeof symbolsType === 'string') {
      if (compareType === symbolsType) {
        return true;
      }

      return false;
    }

    if (typeof symbolsType === 'object') {
      for (let i = 0; i < symbolsType.length; i += 1) {
        if (compareType === symbolsType[i]) {
          return true;
        }
      }

      return false;
    }

    return false;
  };

  checkScope = (actualScope, objectScope) => {
    if (actualScope.length >= objectScope.length) {
      for (let i = 0; i < objectScope.length; i += 1) {
        if (actualScope[i] !== objectScope[i]) return true;
      }

      return false;
    }

    return true;
  };

  checkDuplicate(token, type) {
    const findItem = this.symbolTable
      .slice()
      .reverse()
      .find((item) => item.token.lexema === token.lexema);

    if (!findItem) return true;

    if (
      findItem.scope !== this.actualScope &&
      this.compareIdentifierType(type, SymbolTableType.VARIABLE)
    ) {
      if (this.compareIdentifierType(findItem.type, SymbolTableType.VARIABLE))
        return true;
    }

    return this.Error(ErrorType.DUPLICATED, token);
  }

  updateSymbolTableVariableType(index, type) {
    if (this.symbolTable[index]) this.symbolTable[index].declarationType = type;
  }

  insertTable(token, type, declarationType, label) {
    console.group('Insert Table');
    console.log(token, type, declarationType);
    console.log('Symbol Table', this.symbolTable);
    console.log('Scope Table', this.scopeTable);

    this.checkDuplicate(token, type);

    this.symbolTable.push({
      token,
      type,
      declarationType,
      scope: this.actualScope,
      label,
    });

    if (
      this.compareIdentifierType(type, [
        SymbolTableType.FUNCTION_BOOLEAN,
        SymbolTableType.FUNCTION_INTEGER,
        SymbolTableType.PROCEDURE,
      ])
    ) {
      this.actualScope += 1;
      this.scopeTable.push(token);
    }

    console.groupEnd();

    return this.symbolTable.length === 0 ? 0 : this.symbolTable.length - 1;
  }

  popScope() {
    this.symbolTable = this.symbolTable.filter(
      (symbol) => symbol.scope < this.actualScope
    );

    this.actualScope -= 1;
    return this.scopeTable.pop();
  }

  searchTable(token, type) {
    console.log('Search Table', token, type);
    console.log('SymbolTable', this.symbolTable.slice().reverse());
    const findItem = this.symbolTable
      .slice()
      .reverse()
      .find(
        (item) =>
          item.token.lexema === token.lexema &&
          this.compareIdentifierType(item.type, type)
      );

    console.log('Found Item', findItem);

    const throwError = () => {
      if (typeof type === 'object') {
        this.Error(ErrorType.UNDECLARED, token);
      } else if (
        this.compareIdentifierType(type, [
          SymbolTableType.FUNCTION_BOOLEAN,
          SymbolTableType.FUNCTION_INTEGER,
        ])
      ) {
        this.Error(ErrorType.UNDECLARED_FUNC, token);
      } else if (this.compareIdentifierType(type, SymbolTableType.PROCEDURE)) {
        this.Error(ErrorType.UNDECLARED_PROC, token);
      } else if (this.compareIdentifierType(type, SymbolTableType.VARIABLE)) {
        this.Error(ErrorType.UNDECLARED_VAR, token);
      }
    };

    if (!findItem) throwError();

    return findItem;
  }

  insertExpression(lexema, type) {
    const expressionItem = { lexema, type };
    if (
      this.compareIdentifierType(type, [
        SymbolsType.IDENTIFICADOR,
        SymbolsType.DIGITO,
        SymbolsType.VERDADEIRO,
        SymbolsType.FALSO,
      ])
    ) {
      if (this.compareIdentifierType(type, SymbolsType.IDENTIFICADOR)) {
        expressionItem.symbol = this.symbolTable
          .slice()
          .reverse()
          .find((item) => item.token.lexema === lexema);
      }
      this.expression.push(expressionItem);
    } else if (this.compareIdentifierType(type, SymbolsType.ABREPARENTESES)) {
      this.expressionLevel += 1;
      this.expressionStack.push(expressionItem);
    } else if (this.compareIdentifierType(type, SymbolsType.FECHAPARENTESES)) {
      let stackItem = null;
      do {
        stackItem = this.expressionStack.pop();
        if (stackItem.lexema !== '(') this.expression.push(stackItem);
      } while (stackItem.lexema !== '(');
      this.expressionLevel -= 1;
    } else {
      const operatorItem = this.precedenceTable.find(
        (item) => item.lexema === lexema
      );
      const stackOperatorItem =
        this.expressionStack.length > 0
          ? this.precedenceTable.find(
              (item) =>
                item.lexema ===
                this.expressionStack[this.expressionStack.length - 1].lexema
            )
          : null;

      if (!operatorItem) return;

      if (
        !stackOperatorItem ||
        (stackOperatorItem && stackOperatorItem.lexema === '(')
      ) {
        this.expressionStack.push(expressionItem);
      } else if (operatorItem.level <= stackOperatorItem.level) {
        this.expression.push(this.expressionStack.pop());
        this.expressionStack.push(expressionItem);
      } else {
        this.expressionStack.push(expressionItem);
      }
    }
    console.group('insertExpression');
    console.log('this.expression', this.expression);
    console.log('this.expressionStack', this.expressionStack);
    console.log('this.expressionLevel', this.expressionLevel);
    console.groupEnd();
  }

  validateOperationType(type, item, token) {
    if (!item) this.Error(ErrorType.INVALID_EXPRESSION_OPERATION, token);
    console.log(type, item, token);
    if (type === PrecedenceTableType.BOOLEAN) {
      if (
        this.compareIdentifierType(item, [
          PrecedenceTableType.INTEGER,
          PrecedenceTableType.BOOLEAN,
        ])
      ) {
        if (item === PrecedenceTableType.INTEGER)
          this.Error(ErrorType.INVALID_EXPRESSION, token);
      } else {
        if (this.compareIdentifierType(item.type, SymbolsType.DIGITO))
          this.Error(ErrorType.INVALID_EXPRESSION, token);

        if (this.compareIdentifierType(item.type, SymbolsType.IDENTIFICADOR)) {
          if (item.symbol.declarationType !== PrecedenceTableType.BOOLEAN)
            this.Error(ErrorType.INVALID_EXPRESSION, token);
        }
      }
    } else if (type === PrecedenceTableType.INTEGER) {
      if (
        this.compareIdentifierType(item, [
          PrecedenceTableType.INTEGER,
          PrecedenceTableType.BOOLEAN,
        ])
      ) {
        if (item === PrecedenceTableType.BOOLEAN)
          this.Error(ErrorType.INVALID_EXPRESSION, token);
      } else {
        if (
          this.compareIdentifierType(item.type, [
            SymbolsType.VERDADEIRO,
            SymbolsType.FALSO,
          ])
        )
          this.Error(ErrorType.INVALID_EXPRESSION, token);

        if (this.compareIdentifierType(item.type, SymbolsType.IDENTIFICADOR)) {
          if (item.symbol.declarationType !== PrecedenceTableType.INTEGER)
            this.Error(ErrorType.INVALID_EXPRESSION, token);
        }
      }
    }
  }

  verifyExpressionEnd(returnType, line) {
    if (!returnType || this.expressionLevel !== 0) return;

    console.log(this.expressionStack.slice(), this.expressionStack.length);

    while (this.expressionStack.length > 0) {
      this.expression.push(this.expressionStack.pop());
    }

    const saveExpression = this.expression.slice();

    console.group('Expression End');
    console.log('returnType', returnType);
    console.log('line', line);
    console.log('this.expression', this.expression.slice());
    console.log('saveExpression', saveExpression);
    console.log('this.expressionStack', this.expressionStack.slice());
    console.log('this.expressionLevel', this.expressionLevel);
    console.groupEnd();

    if (this.expression.length === 1) {
      this.validateOperationType(returnType, this.expression[0], {
        expression: saveExpression,
        line,
      });
      this.expression[0] = returnType;
    } else if (this.expression.length > 1) {
      let i;
      let { length } = this.expression;
      for (i = 0; i < length; i += 1) {
        const expressionItem = this.expression[i];
        if (
          !this.compareIdentifierType(expressionItem.type, [
            SymbolsType.IDENTIFICADOR,
            SymbolsType.DIGITO,
            SymbolsType.VERDADEIRO,
            SymbolsType.FALSO,
          ])
        ) {
          const operatorItem = this.precedenceTable.find(
            (item) => item.lexema === expressionItem.lexema
          );

          if (operatorItem && operatorItem.operators === 1) {
            this.validateOperationType(
              operatorItem.type,
              this.expression[i - 1],
              {
                expression: saveExpression,
                line,
              }
            );
          } else if (operatorItem && operatorItem.operators === 2) {
            this.validateOperationType(
              operatorItem.type,
              this.expression[i - 2],
              {
                expression: saveExpression,
                line,
              }
            );
            this.validateOperationType(
              operatorItem.type,
              this.expression[i - 1],
              {
                expression: saveExpression,
                line,
              }
            );
          }

          this.expression[i] = operatorItem.return;
          this.expression.splice(
            i - operatorItem.operators,
            operatorItem.operators
          );
          i -= operatorItem.operators;
          length -= operatorItem.operators;
          console.log('New Expression', this.expression);
        }
      }
    }

    if (this.expression.length !== 1 || returnType !== this.expression[0])
      this.Error(ErrorType.INVALID_EXPRESSION_RETURN, {
        expression: saveExpression,
        line,
      });

    console.group('Expression End - Calculated');
    console.log('returnType', returnType);
    console.log('expression type', this.expression[0]);
    console.log('line', line);
    console.log('expression', this.expression);
    console.log('save expression', saveExpression);
    console.groupEnd();

    this.expression = [];
    this.expressionStack = [];
    this.expressionLevel = 0;
  }
}
