type PropsT = Record<string, unknown> & {
  children: (ElementT | TextElementT)[];
};

type ElementT = {
  type: string;
  props: PropsT;
};

type TextElementT = {
  type: "TEXT_ELEMENT";
  props: {
    nodeValue: string;
    children: [];
  };
};

type FiberT = {
  type: string;
  props: PropsT;
  dom: undefined | HTMLElement | Text;
  parent?: FiberT;
  child?: FiberT;
  sibling?: FiberT;
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

const createDom = (fiber: ElementT | TextElementT) => {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  Object.keys(fiber.props)
    .filter(checkIsProp)
    .forEach((prop) => {
      // TODO: add type guard for all possible html elements attributes
      // @ts-ignore
      dom[prop] = element.props[prop];
    });

  return dom;
};

const render = (element: ElementT | TextElementT, container: HTMLElement) => {
  nextUnitOfWork = {
    type: "ROOT",
    dom: container,
    props: {
      children: [element],
    },
  };
};

let nextUnitOfWork: undefined | FiberT = undefined;

const performUnitOfWork = (fiber: FiberT) => {
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent && fiber.parent.dom) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  // create new fibers
  const elements = fiber.props.children;

  let index = 0;

  let prevSibling: undefined | FiberT = undefined;

  while (elements.length < index) {
    const element = elements[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      dom: undefined,
      parent: fiber,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      if (!prevSibling) {
        throw new Error("prevSibling should exist");
      }

      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;

    index++;
  }

  // return next unit of work
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber: undefined | FiberT = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
};

const workLoop = (deadline: IdleDeadline) => {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadline.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

export const Didact = {
  createElement,
};

export const DidactDOM = {
  render,
};
