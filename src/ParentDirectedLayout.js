import { parseValue, parseValues } from "./utils";
import { H_BEFORE, H_AFTER, V_BEFORE, V_AFTER } from "./cssProps";
import { SelfDirectedLayout } from "./SelfDirectedLayout";

export class ParentDirectedLayout {
  static get inputProperties() {
    return [H_BEFORE, H_AFTER, V_BEFORE, V_AFTER];
  }

  *intrinsicSizes() {}

  *layout(children, edges, constraints, styleMap) {}
}

const register = () => registerLayout("parent-directed", SelfDirectedLayout);

export default register;
