const element = (
  <div>
    <span>some text</span>
    <span>some more text</span>
    <div>one line of jsx</div>
    just pure text without wrapping with node
  </div>
);

DidactDOM.render(element, document.getElementById("root"));
