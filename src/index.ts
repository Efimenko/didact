type ElementT = {
  type: string;
  props: Record<string, unknown> & { children: (ElementT | TextElementT)[] };
};

type TextElementT = {
  type: "TEXT_ELEMENT";
  props: {
    nodeValue: string;
    children: [];
  };
};

const createTextElement = (
  text: TextElementT["props"]["nodeValue"],
): TextElementT => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
};

const createElement = (
  type: ElementT["type"],
  props: ElementT["props"],
  ...children: (ElementT | string)[]
) => {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child),
      ),
    },
  };
};

const checkIsProp = (prop: string) => prop !== "children";

const render = (
  element: ElementT | TextElementT,
  container: HTMLElement | Text,
) => {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  Object.keys(element.props)
    .filter(checkIsProp)
    .forEach((prop) => {
      // TODO: add type guard for all possible html elements attributes
      // @ts-ignore
      dom[prop] = element.props[prop];
    });

  element.props.children.forEach((child) => {
    render(child, dom);
  });

  container.appendChild(dom);
};

export const Didact = {
  createElement,
};

export const DidactDOM = {
  render,
};
