import * as v from "valibot";

/** Whether an error is MongoDB rejecting a duplicate on a unique index */
export function isDuplicateKeyError(error: unknown) {
  return v.is(v.object({ code: v.literal(11000) }), error);
}
