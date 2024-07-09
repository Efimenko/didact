export class AssertionError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export function assert<InputT, OutputT extends InputT>(
  input: InputT,
  guard: (input: InputT) => input is OutputT,
  message?: string,
): asserts input is OutputT {
  if (!guard(input)) {
    throw new AssertionError(message);
  }
}

export function asserted<InputT, OutputT extends InputT>(
  input: InputT,
  guard: (input: InputT) => input is OutputT,
  message?: string,
): OutputT {
  assert(input, guard, message);

  return input;
}
