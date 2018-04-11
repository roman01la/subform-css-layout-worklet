const H_BEFORE = "--space-horizontal-before";
const H_AFTER = "--space-horizontal-after";
const V_BEFORE = "--space-vertical-before";
const V_AFTER = "--space-vertical-after";

const CROSS_LEFT = "--cross-left";
const CROSS_RIGHT = "--cross-right";

const MAIN_RIGHT = "--main-right";
const MAIN_LEFT = "--main-left";
const MAIN_BETWEEN = "--main-between";

const LAYOUT = "--layout";

const GRID = "--grid";
const GRID_COLUMNS = "--grid-columns";
const GRID_ROWS = "--grid-rows";
const GRID_SPACE = "--grid-space-horizontal";

const spaceValue = /^(\d)s$/;

const _parseValue = value => {
  if (spaceValue.test(value)) {
    return { space: parseInt(value.match(spaceValue)[1]) };
  } else if (Number.isNaN(parseInt(value)) !== true) {
    return { px: parseInt(value) };
  } else {
    throw new Error(
      `Wrong value "${value}" passed into ${prop} layout property`
    );
  }
};

const parseValue = (prop, m) => {
  if (m.get(prop).length !== 0) {
    const value = m.get(prop)[0].trim();
    return _parseValue(value);
  }
};

const parseValues = (prop, m) => {
  if (m.get(prop).length !== 0) {
    const values = m
      .get(prop)[0]
      .trim()
      .split(/ +/)
      .map(v => _parseValue(v));

    return values;
  }
};

class ParentDirectedLayout {
  static get inputProperties() {
    return [H_BEFORE, H_AFTER, V_BEFORE, V_AFTER];
  }

  *intrinsicSizes() {}

  *layout(children, edges, constraints, styleMap) {}
}

class SelfDirectedLayout {
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

class ArtboardLayout {
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

registerLayout("self-directed", SelfDirectedLayout);
registerLayout("parent-directed", SelfDirectedLayout);
registerLayout("artboard", ArtboardLayout);
