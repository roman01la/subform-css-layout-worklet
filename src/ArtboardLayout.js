import { parseValue, parseValues } from "./utils";
import { CROSS_LEFT, CROSS_RIGHT } from "./cssProps";

export class ArtboardLayout {
  static get inputProperties() {
    return [CROSS_LEFT, CROSS_RIGHT];
  }

  *intrinsicSizes() {}

  *layout(children, edges, constraints, styleMap) {
    const fixedInlineSize = constraints.fixedInlineSize;

    const childFragments = yield children.map(child => {
      return child.layoutNextFragment({});
    });
    return { childFragments };
  }
}

const register = () => registerLayout("artboard", ArtboardLayout);

export default register;
