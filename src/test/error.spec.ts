import { expect } from "chai";
import { CueMeInError } from "../main/error";

describe("error", () => {
  describe("CueMeInError", () => {
    it("should be an instance of Error", () => {
      const error = new CueMeInError("test-message");

      expect(error).to.be.instanceOf(Error);
    });

    it("should apply default options", () => {
      const error = new CueMeInError("test-message");

      expect(error).to.deep.include({
        children: [],
        exit: 1,
        name: "CueMeInError",
        status: 500
      });
    });

    it("should persist all options", () => {
      /**
       * All possible options that might be provided to `CueMeInError`.
       */
      type CueMeInErrorOptions = ConstructorParameters<typeof CueMeInError>[1];

      /*
       * The following `Required` ensures all options are defined, so the test
       * covers all properties.
       */
      const allOptions: Required<CueMeInErrorOptions> = {
        children: ["test-child-1", "test-child-2"],
        context: "test-context",
        exit: 123,
        original: new Error("test-original-error-message"),
        status: 456
      };

      const error = new CueMeInError("test-message", allOptions);

      expect(error).to.deep.include(allOptions);
    });
  });
});
