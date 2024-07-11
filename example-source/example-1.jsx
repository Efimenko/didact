import { Didact, DidactDOM } from "../src";

const AnotherComponent = () => <div>another component</div>;

const App = () => (
  <div>
    <span>some text</span>
    <AnotherComponent />
    <span>some more text</span>
    <div onClick={() => alert("check it")}>one line of jsx</div>
    just pure text without wrapping with node
  </div>
);

DidactDOM.render(<App />, document.getElementById("root"));
