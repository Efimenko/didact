const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children,
    },
  };
};

export const Didact = {
  createElement,
};
