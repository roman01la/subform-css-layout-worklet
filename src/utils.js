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

export const parseValue = (prop, m) => {
  if (m.get(prop).length !== 0) {
    const value = m.get(prop)[0].trim();
    return _parseValue(value);
  }
};

export const parseValues = (prop, m) => {
  if (m.get(prop).length !== 0) {
    const values = m
      .get(prop)[0]
      .trim()
      .split(/ +/)
      .map(v => _parseValue(v));

    return values;
  }
};
