import { parseValue, parseValues } from "./utils";
import {
  LAYOUT,
  GRID,
  GRID_COLUMNS,
  GRID_ROWS,
  GRID_SPACE,
  MAIN_RIGHT,
  MAIN_LEFT,
  MAIN_BETWEEN
} from "./cssProps";

export class SelfDirectedLayout {
  static get inputProperties() {
    return [
      LAYOUT,
      GRID,
      GRID_COLUMNS,
      GRID_ROWS,
      GRID_SPACE,
      MAIN_RIGHT,
      MAIN_LEFT,
      MAIN_BETWEEN
    ];
  }

  static get childInputProperties() {
    return [GRID, "display"];
  }

  *intrinsicSizes() {}

  *layout(children, edges, constraints, styleMap) {
    const fixedInlineSize = constraints.fixedInlineSize;

    const layoutType = styleMap.get(LAYOUT)[0].trim();

    if (layoutType === "grid") {
      const fixedInlineSize = constraints.fixedInlineSize;

      const columns = parseValues(GRID_COLUMNS, styleMap);
      const rows = parseValues(GRID_ROWS, styleMap);

      const space = parseValues(GRID_SPACE, styleMap);
      const [spaceBefore, spaceBetween, spaceAfter] = (space.length > 0
        ? space
        : [0, 0, 0]
      ).map(s => s.px);

      const availableInlineSize =
        fixedInlineSize -
        spaceBefore -
        spaceAfter -
        spaceBetween * (children.length - 1);

      const totalInlineSpace = columns.reduce((sum, c) => sum + c.space, 0);
      const columnSize = availableInlineSize / totalInlineSpace;

      const sortedChildren = children
        .map((child, idx) => [...parseValues(GRID, child.styleMap), idx])
        .sort((a, b) => a[0].px - b[0].px);

      const childFragments = yield children.map(child => {
        const [gridColumn, gridRow] = parseValues(GRID, child.styleMap);

        let size = columns[gridColumn.px - 1].space * columnSize;
        const props = { fixedInlineSize: size };

        if (
          child.styleMap.get("display").toString() === "layout(parent-directed)"
        ) {
          return child.layoutNextFragment(props);
        } else {
          return child.layoutNextFragment({});
        }
      });

      sortedChildren.forEach(([gridColumn, gridRow, fragmentIdx], idx) => {
        const child = children[fragmentIdx];
        const childFragment = childFragments[fragmentIdx];

        if (
          child.styleMap.get("display").toString() === "layout(parent-directed)"
        ) {
          if (fragmentIdx > 0) {
            const prevChild = childFragments[sortedChildren[idx - 1][2]];
            childFragment.inlineOffset =
              prevChild.inlineOffset + prevChild.inlineSize + spaceBetween;
          } else {
            childFragment.inlineOffset = spaceBefore;
          }
        }
      });

      return { childFragments };
    }

    if (layoutType === "horizontal") {
      const left = parseValue(MAIN_LEFT, styleMap);
      const right = parseValue(MAIN_RIGHT, styleMap);
      const between = parseValue(MAIN_BETWEEN, styleMap);

      const totalSpace =
        (left.space !== undefined ? left.space : 0) +
        (right.space !== undefined ? right.space : 0);

      const totalBetween = { px: between.px * (children.length - 1) };

      const childFragments = yield children.map(child => {
        return child.layoutNextFragment({});
      });

      const totalChildInlineSize = childFragments.reduce(
        (sum, child) => sum + child.inlineSize,
        0
      );

      const availableInlineSize =
        fixedInlineSize -
        totalChildInlineSize -
        totalBetween.px -
        (left.px !== undefined ? left.px : 0) -
        (right.px !== undefined ? right.px : 0);

      const spaceAmount = availableInlineSize / totalSpace;

      childFragments.forEach((child, idx) => {
        child.inlineOffset = spaceAmount * left.space + child.inlineSize * idx;
        if (idx > 0) {
          child.inlineOffset += between.px * idx;
        }
      });

      return { childFragments };
    }
  }
}

const register = () => registerLayout("self-directed", SelfDirectedLayout);

export default register;
