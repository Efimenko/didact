import { checkNonUndefined } from "./utils/nullable/non-nullable";
import { assert } from "./utils/typescript/assert";

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
  alternate: undefined | FiberT;
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION";
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

const checkIsEventListener = (key: string) => key.startsWith("on");

const checkIsProperty = (key: string) =>
  key !== "children" && !checkIsEventListener(key);

const getCheckIsNew =
  (prev: Record<string, unknown>, next: Record<string, unknown>) =>
  (key: string) =>
    prev[key] !== next[key];

const getCheckIsGone = (next: Record<string, unknown>) => (key: string) =>
  !(key in next);

const setPropToDom = (dom: HTMLElement | Text, key: string, value: unknown) => {
  // TODO: add type guard for all possible html elements attributes
  // @ts-ignore
  dom[key] = value;
};

const createDom = (fiber: FiberT) => {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
};

const updateDom = (
  dom: HTMLElement | Text,
  prevProps: Record<string, unknown>,
  nextProps: Record<string, unknown>,
) => {
  // remove old event listeners
  Object.keys(prevProps)
    .filter(checkIsEventListener)
    .filter(getCheckIsGone(nextProps))
    .forEach((key) => {
      assert(dom, checkNonUndefined);

      const eventType = key.toLowerCase().substring(2);

      dom.removeEventListener(eventType, prevProps[key] as EventListener);
    });

  // remove old properties
  Object.keys(prevProps)
    .filter(checkIsProperty)
    .filter(getCheckIsGone(nextProps))
    .forEach((key) => {
      assert(dom, checkNonUndefined);

      setPropToDom(dom, key, "");
    });

  // add or update properties
  Object.keys(nextProps)
    .filter(checkIsProperty)
    .filter(getCheckIsNew(prevProps, nextProps))
    .forEach((key) => {
      assert(dom, checkNonUndefined);

      setPropToDom(dom, key, nextProps[key]);
    });

  // add new event listeners
  Object.keys(nextProps)
    .filter(checkIsEventListener)
    .filter(getCheckIsNew(prevProps, nextProps))
    .forEach((key) => {
      assert(dom, checkNonUndefined);

      const eventType = key.toLowerCase().substring(2);

      dom.addEventListener(eventType, nextProps[key] as EventListener);
    });
};

const commitWork = (fiber: undefined | FiberT) => {
  if (!fiber) {
    return;
  }

  assert(fiber.parent, checkNonUndefined);

  assert(fiber.parent.dom, checkNonUndefined);

  switch (fiber.effectTag) {
    case "PLACEMENT": {
      if (fiber.dom !== undefined) {
        fiber.parent.dom.appendChild(fiber.dom);
      }

      break;
    }
    case "UPDATE": {
      if (fiber.dom !== undefined) {
        assert(fiber.alternate, checkNonUndefined);

        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
      }
      break;
    }
    case "DELETION": {
      assert(fiber.dom, checkNonUndefined);

      fiber.parent.dom.removeChild(fiber.dom);
    }
  }

  commitWork(fiber.child);

  commitWork(fiber.sibling);
};

const commitRoot = () => {
  deletions.forEach(commitWork);

  commitWork(workInProgressRoot?.child);

  currentRoot = workInProgressRoot;

  workInProgressRoot = undefined;
};

const render = (element: ElementT | TextElementT, container: HTMLElement) => {
  workInProgressRoot = {
    type: "ROOT",
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };

  deletions = [];

  nextUnitOfWork = workInProgressRoot;
};

let nextUnitOfWork: undefined | FiberT = undefined;

let workInProgressRoot: undefined | FiberT = undefined;

let currentRoot: undefined | FiberT = undefined;

let deletions: FiberT[] = [];

const reconcileChildren = (
  fiber: FiberT,
  elements: (ElementT | TextElementT)[],
) => {
  let index = 0;

  let oldFiber = fiber.alternate && fiber.alternate.child;

  let prevSibling: undefined | FiberT = undefined;

  while (elements.length > index || oldFiber !== undefined) {
    const element = elements[index];

    let newFiber = undefined;

    const sameType = oldFiber && element && oldFiber.type === element.type;

    if (sameType) {
      assert(oldFiber, checkNonUndefined);

      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: fiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      } as const;
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: undefined,
        parent: fiber,
        alternate: undefined,
        effectTag: "PLACEMENT",
      } as const;
    }

    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";

      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      if (prevSibling) {
        prevSibling.sibling = newFiber;
      }
    }

    prevSibling = newFiber;

    index++;
  }
};

const performUnitOfWork = (fiber: FiberT) => {
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // create new fibers for direct children
  const elements = fiber.props.children;

  reconcileChildren(fiber, elements);

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

  if (!nextUnitOfWork && workInProgressRoot) {
    commitRoot();
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
