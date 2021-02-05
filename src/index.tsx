import React from "react";
import ReactDOM from "react-dom";

import App from "./App";
import Engine from "./Engine";

const engine = new Engine();

ReactDOM.render(<App engine={engine} />, document.getElementById("root"));
