export const checkNonUndefined = <ValueT extends undefined | unknown>(
  value: ValueT,
): value is Exclude<ValueT, undefined> => value !== undefined;

export const checkNonNull = <ValueT extends null | unknown>(
  value: ValueT,
): value is Exclude<ValueT, null> => value !== null;

export const checkNonNullable = <ValueT extends undefined | null | unknown>(
  value: ValueT,
): value is Exclude<ValueT, undefined | null> =>
  checkNonUndefined(value) && checkNonNull(value);
