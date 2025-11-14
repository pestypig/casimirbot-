let ready: Promise<void> | null = null;

export async function ensureSpecialistsRegistered(): Promise<void> {
  if (process.env.ENABLE_SPECIALISTS !== "1") {
    return;
  }
  if (!ready) {
    ready = (async () => {
      const { registerSolver } = await import("./solvers");
      const { registerVerifier } = await import("./verifiers");
      const { mathSumSpec, mathSumHandler } = await import("./solvers/math.sum");
      const { mathExprSpec, mathExprHandler } = await import("./solvers/math.expr");
      const { mathWordSpec, mathWordHandler } = await import("./solvers/math.word");
      const { codeIsBalancedSpec, codeIsBalancedHandler } = await import("./solvers/code.isBalanced");
      const { philoSynthesisSpec, philoSynthesisHandler } = await import("./solvers/philo.synthesis");
      const { mathSumVerifierSpec, mathSumVerifierHandler } = await import("./verifiers/math.sum.verify");
      const { mathSympyVerifierSpec, mathSympyVerifierHandler } = await import("./verifiers/math.sympy.verify");
      const { mathWordVerifierSpec, mathWordVerifierHandler } = await import("./verifiers/math.word.verify");
      const { codeIsBalancedVerifierSpec, codeIsBalancedVerifierHandler } = await import("./verifiers/code.isBalanced.verify");
      const { philoSynthesisVerifierSpec, philoSynthesisVerifierHandler } = await import("./verifiers/philo.synthesis.verify");
      const { evolutionVerifierSpec, evolutionVerifierHandler } = await import("./verifiers/evolution.verify");
      registerSolver({ ...mathSumSpec, handler: mathSumHandler });
      registerSolver({ ...mathExprSpec, handler: mathExprHandler });
      registerSolver({ ...mathWordSpec, handler: mathWordHandler });
      registerSolver({ ...codeIsBalancedSpec, handler: codeIsBalancedHandler });
      registerSolver({ ...philoSynthesisSpec, handler: philoSynthesisHandler });
      registerVerifier({ ...mathSumVerifierSpec, handler: mathSumVerifierHandler });
      registerVerifier({ ...mathSympyVerifierSpec, handler: mathSympyVerifierHandler });
      registerVerifier({ ...mathWordVerifierSpec, handler: mathWordVerifierHandler });
      registerVerifier({ ...codeIsBalancedVerifierSpec, handler: codeIsBalancedVerifierHandler });
      registerVerifier({ ...philoSynthesisVerifierSpec, handler: philoSynthesisVerifierHandler });
      registerVerifier({ ...evolutionVerifierSpec, handler: evolutionVerifierHandler });
    })();
  }
  await ready;
}
