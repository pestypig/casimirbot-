declare module "nerdamer" {
  namespace nerdamer {
    type NumericSubstitutions = Record<string, string | number>;

    function solve(equation: ExpressionParam, variable: string): Expression;

    function solveEquations(
      equations: ExpressionParam | ExpressionParam[],
      variables?: string | string[],
    ): unknown;

    function diff(expression: ExpressionParam, variable: string, n?: int): Expression;
  }

  function nerdamer(
    expression: nerdamer.ExpressionParam,
    subs?: nerdamer.NumericSubstitutions,
    option?: keyof nerdamer.Options | (keyof nerdamer.Options)[],
    location?: nerdamer.int,
  ): nerdamer.Expression;

  export = nerdamer;
}
